// Pruebas de las reglas de seguridad de Firestore (firestore.rules) con el SDK real contra los emuladores.
// Las escrituras "permitidas" repiten exactamente las que hace la app (repositorios); las "denegadas"
// son intentos de abuso que las reglas deben frenar. Se ejecutan con: npm run test:rules
// (levanta los emuladores de Authentication y Firestore, corre esto y los apaga; necesita Java 21 o superior).
import { initializeApp, setLogLevel } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendEmailVerification } from "firebase/auth";
import {
  addDoc, arrayUnion, collection, connectFirestoreEmulator, deleteDoc, deleteField, doc, getDoc,
  getDocs, getFirestore, increment, limit, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";

setLogLevel("silent"); // los rechazos esperados no deben llenar la consola
const PROJECT = "demo-reloop";
// Mismo puerto que `emulators.firestore.port` en firebase.json (8080 suele estar ocupado por Apache/XAMPP)
const FIRESTORE_PORT = 8085;
const config = { apiKey: "demo", authDomain: "demo", projectId: PROJECT, appId: "1:1:web:1" };
const run = Date.now().toString(36);

// Limpia datos de ejecuciones anteriores
await fetch(`http://127.0.0.1:${FIRESTORE_PORT}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });

// Confirma el correo como lo haría la persona al abrir el enlace: el emulador guarda el código del
// correo de verificación, que se canjea con la misma llamada que usa la página de Firebase.
async function verifyEmail(user) {
  await sendEmailVerification(user);
  const codes = await (await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/oobCodes`)).json();
  const mine = codes.oobCodes.filter((c) => c.email === user.email && c.requestType === "VERIFY_EMAIL").pop();
  await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ oobCode: mine.oobCode }),
  });
  await user.reload();
  await user.getIdToken(true); // las reglas leen `email_verified` del token
}

async function client(label, { verified = true } = {}) {
  const app = initializeApp(config, `${label}-${run}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const cred = await createUserWithEmailAndPassword(auth, `${label}-${run}@test.mx`, "secreto1");
  if (verified) await verifyEmail(cred.user);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", FIRESTORE_PORT);
  return { uid: cred.user.uid, db, label, user: cred.user };
}

const results = [];
async function expectOk(name, fn) {
  try { await fn(); results.push({ ok: true, name: `PERMITIDO  ${name}` }); }
  catch (e) { results.push({ ok: false, name: `PERMITIDO  ${name}  -> FALLÓ: ${e.code || e.message}` }); }
}
async function expectDenied(name, fn) {
  try { await fn(); results.push({ ok: false, name: `DENEGADO   ${name}  -> SE PERMITIÓ (error de reglas)` }); }
  catch (e) {
    const denied = e.code === "permission-denied";
    results.push({ ok: denied, name: `DENEGADO   ${name}${denied ? "" : `  -> falló por otra causa: ${e.code || e.message}`}` });
  }
}

const A = await client("ana");
const B = await client("beto");
const C = await client("carla");

// ── escrituras de la app ────────────────────────────────────────────────────
const profileDoc = (name, extra = {}) => ({
  nombre: name, fotoUrl: null, descripcion: "", color: "azul", etiquetas: [], stickers: [], ...extra,
});
const ensureProfile = (u, name) => runTransaction(u.db, async (t) => {
  const ref = doc(u.db, "usuarios", u.uid);
  if ((await t.get(ref)).exists()) return;
  t.set(ref, { uid: u.uid, ...profileDoc(name), creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
});
const saveProfile = (u, data) => setDoc(doc(u.db, "usuarios", u.uid), { ...data, correo: deleteField(), actualizadoEn: serverTimestamp() }, { merge: true });
// Igual que claimUsername: reserva el nuevo, libera el anterior y actualiza el perfil en una transacción
const claimUsername = (u, name) => runTransaction(u.db, async (t) => {
  const perfilRef = doc(u.db, "usuarios", u.uid);
  const nuevaRef = doc(u.db, "usernames", name);
  const [perfil, reserva] = await Promise.all([t.get(perfilRef), t.get(nuevaRef)]);
  if (reserva.exists() && reserva.data().uid !== u.uid) throw Object.assign(new Error("ocupado"), { code: "permission-denied" });
  const anterior = perfil.data().usernameNormalized;
  if (anterior === name) return;
  if (!reserva.exists()) t.set(nuevaRef, { uid: u.uid, creadoEn: serverTimestamp() });
  if (anterior) t.delete(doc(u.db, "usernames", anterior));
  t.update(perfilRef, { username: name, usernameNormalized: name, actualizadoEn: serverTimestamp() });
});

const newProduct = (u, over = {}) => ({
  ownerId: u.uid, seller: u.label, name: "Calculadora", description: "Buena", category: "venta", price: 280,
  imageUrl: null, distance: "0.0 km", resenasTotal: 0, resenasCount: 0, creadoEn: serverTimestamp(), ...over,
});
const createProduct = (u, id, over) => setDoc(doc(u.db, "productos", id), newProduct(u, over));
// Igual que `enviarResena` en la app: la reseña y la suma al promedio en un solo lote
const review = (u, productId, estrellas, texto = "Muy rico") => {
  const b = writeBatch(u.db);
  b.set(doc(u.db, "productos", productId, "resenas", u.uid), { autor: u.label, estrellas, texto, creadoEn: serverTimestamp() });
  b.update(doc(u.db, "productos", productId), { resenasTotal: increment(estrellas), resenasCount: increment(1) });
  return b.commit();
};
const askReview = (owner, productId, buyer) =>
  setDoc(doc(owner.db, "productos", productId, "solicitudes", buyer.uid), { chatId: "chat-x", creadoEn: serverTimestamp() });
const chatIdFor = (a, b) => [a, b].sort().join("_");
const openChat = (me, other, product) => runTransaction(me.db, async (t) => {
  const id = chatIdFor(me.uid, other.uid);
  const chatRef = doc(me.db, "chats", id);
  const existing = await t.get(chatRef);
  const now = serverTimestamp();
  const intro = product ? `Hola, me interesa "${product.name}".` : null;
  const introRef = doc(collection(chatRef, "mensajes"));
  const lastMessage = intro ? { text: intro, from: me.uid, hasImages: false, time: now } : null;
  if (!existing.exists()) {
    const [first, second] = [me.uid, other.uid].sort();
    t.set(chatRef, {
      participants: [first, second], names: { [me.uid]: me.label, [other.uid]: other.label },
      productId: product?.id ?? null, introducedProducts: product ? [product.id] : [], lastMessage,
      reads: { [me.uid]: now }, creadoEn: now, actualizadoEn: now,
    });
    if (intro) t.set(introRef, { from: me.uid, text: intro, images: [], creadoEn: now });
    return;
  }
  if (!product || existing.data().introducedProducts?.includes(product.id)) return;
  t.update(chatRef, { productId: product.id, introducedProducts: arrayUnion(product.id), lastMessage, [`reads.${me.uid}`]: now, actualizadoEn: now });
  t.set(introRef, { from: me.uid, text: intro, images: [], creadoEn: now });
});
const sendMessage = async (u, chatId, text, images = []) => {
  const chatRef = doc(u.db, "chats", chatId);
  const now = serverTimestamp();
  const batch = writeBatch(u.db);
  batch.set(doc(collection(chatRef, "mensajes")), { from: u.uid, text, images, creadoEn: now });
  batch.update(chatRef, { lastMessage: { text, from: u.uid, hasImages: images.length > 0, time: now }, [`reads.${u.uid}`]: now, actualizadoEn: now });
  await batch.commit();
};

// ── PERFILES ────────────────────────────────────────────────────────────────
await expectOk("A crea su propio perfil (como ensureProfile)", () => ensureProfile(A, "Ana"));
await expectOk("B crea su propio perfil", () => ensureProfile(B, "Beto"));
await expectOk("C crea su propio perfil", () => ensureProfile(C, "Carla"));
// Como ensureProfile en la app: la ficha nueva nace con su username y su reserva, juntas
const ensureProfileConUsername = (u, name, username) => runTransaction(u.db, async (t) => {
  const ref = doc(u.db, "usuarios", u.uid);
  const reservaRef = doc(u.db, "usernames", username);
  const [perfil, reserva] = await Promise.all([t.get(ref), t.get(reservaRef)]);
  if (perfil.exists()) return;
  const libre = !reserva.exists();
  t.set(ref, {
    uid: u.uid, ...profileDoc(name, libre ? { username, usernameNormalized: username } : {}),
    creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
  });
  if (libre) t.set(reservaRef, { uid: u.uid, creadoEn: serverTimestamp() });
});
const NUEVO1 = await client("nuevo1");
const NUEVO2 = await client("nuevo2");
await expectOk("Nuevo crea su perfil ya con su username reservado (una sola operación)", async () => {
  await ensureProfileConUsername(NUEVO1, "Dani", `dani${run}`);
  if ((await getDoc(doc(NUEVO1.db, "usuarios", NUEVO1.uid))).data().usernameNormalized !== `dani${run}`) throw new Error("sin username");
});
await expectDenied("Otro crea su perfil con el username que ya reservó el primero", () => runTransaction(NUEVO2.db, async (t) => {
  t.set(doc(NUEVO2.db, "usuarios", NUEVO2.uid), {
    uid: NUEVO2.uid, ...profileDoc("Eli", { username: `dani${run}`, usernameNormalized: `dani${run}` }),
    creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
  });
}));
await expectOk("Otro: si el sugerido está ocupado, su ficha se crea sin username", async () => {
  await ensureProfileConUsername(NUEVO2, "Eli", `dani${run}`);
  if ((await getDoc(doc(NUEVO2.db, "usuarios", NUEVO2.uid))).data().usernameNormalized) throw new Error("tomó uno ocupado");
});
await expectDenied("A crea el perfil de B", () => setDoc(doc(A.db, "usuarios", "otro-uid"), { uid: "otro-uid", ...profileDoc("X"), creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() }));
await expectDenied("A crea perfil con correo", () => setDoc(doc(A.db, "usuarios", A.uid + "x"), { uid: A.uid + "x", ...profileDoc("X"), correo: "a@b.c", creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() }));
await expectOk("A guarda su perfil (nombre, color, etiquetas, stickers, foto https)", () => saveProfile(A, profileDoc("Ana Pérez", { color: "rosa", descripcion: "Hola", etiquetas: [{ id: "1", text: "Mate", color: "azul" }], stickers: ["sticker-1"], fotoUrl: "https://res.cloudinary.com/demo/image/upload/v1/a.png" })));
await expectDenied("A guarda perfil con color inválido", () => saveProfile(A, profileDoc("Ana", { color: "negro" })));
await expectDenied("A guarda perfil con nombre de 31 caracteres", () => saveProfile(A, profileDoc("x".repeat(31))));
await expectDenied("A guarda perfil con nombre vacío", () => saveProfile(A, profileDoc("")));
await expectDenied("A guarda foto http (no https)", () => saveProfile(A, profileDoc("Ana", { fotoUrl: "http://x.com/a.png" })));
await expectDenied("A guarda 5 etiquetas", () => saveProfile(A, profileDoc("Ana", { etiquetas: [1, 2, 3, 4, 5] })));
await expectDenied("A agrega un campo extra al perfil", () => updateDoc(doc(A.db, "usuarios", A.uid), { admin: true }));
await expectDenied("A cambia su uid guardado", () => saveProfile(A, { ...profileDoc("Ana"), uid: B.uid }));
await expectDenied("B edita el perfil de A", () => updateDoc(doc(B.db, "usuarios", A.uid), { nombre: "Hackeada", actualizadoEn: serverTimestamp() }));
await expectDenied("A borra su perfil", () => deleteDoc(doc(A.db, "usuarios", A.uid)));
await expectOk("B lee el perfil de A", async () => { const s = await getDoc(doc(B.db, "usuarios", A.uid)); if (!s.exists() || s.data().nombre !== "Ana Pérez") throw new Error("datos distintos"); });
await expectOk("el perfil de A no contiene correo", async () => { const s = await getDoc(doc(B.db, "usuarios", A.uid)); if ("correo" in s.data()) throw new Error("hay correo"); });
await expectOk("A guarda imagen de fondo https", () => saveProfile(A, profileDoc("Ana Pérez", { fondoUrl: "https://res.cloudinary.com/demo/image/upload/v1/f.png" })));
await expectOk("A quita su imagen de fondo", () => saveProfile(A, profileDoc("Ana Pérez", { fondoUrl: null })));
await expectOk("A elige un avatar orbe (0 a 9)", () => saveProfile(A, profileDoc("Ana Pérez", { orbe: 9 })));
await expectDenied("A guarda un avatar orbe fuera de rango", () => saveProfile(A, profileDoc("Ana Pérez", { orbe: 10 })));
await expectDenied("A guarda un avatar orbe que no es entero", () => saveProfile(A, profileDoc("Ana Pérez", { orbe: "3" })));
await expectOk("A quita su avatar orbe", () => saveProfile(A, profileDoc("Ana Pérez", { orbe: deleteField() })));
await expectDenied("A guarda imagen de fondo http (no https)", () => saveProfile(A, profileDoc("Ana", { fondoUrl: "http://x.com/f.png" })));

// ── ONBOARDING ──────────────────────────────────────────────────────────────
await expectOk("C marca su configuración inicial como pendiente", () => saveProfile(C, profileDoc("Carla", { onboardingPendiente: true })));
await expectOk("C termina la configuración inicial (borra la marca)", () => updateDoc(doc(C.db, "usuarios", C.uid), { onboardingPendiente: deleteField(), actualizadoEn: serverTimestamp() }));
await expectDenied("C guarda la marca con un tipo inválido", () => saveProfile(C, profileDoc("Carla", { onboardingPendiente: "si" })));
await expectDenied("B toca la marca de C", () => updateDoc(doc(B.db, "usuarios", C.uid), { onboardingPendiente: true, actualizadoEn: serverTimestamp() }));

// ── USERNAMES ───────────────────────────────────────────────────────────────
await expectOk("A guarda su perfil con nombre normalizado (para buscar)", () => saveProfile(A, profileDoc("Ana Pérez", { nombreNormalizado: "ana perez" })));
await expectOk("A reserva @ana_p (reserva + perfil en una transacción)", () => claimUsername(A, "ana_p"));
await expectOk("B consulta si @ana_p está libre", async () => { const s = await getDoc(doc(B.db, "usernames", "ana_p")); if (s.data()?.uid !== A.uid) throw new Error("reserva distinta"); });
await expectDenied("B intenta reservar @ana_p (ya es de A)", () => claimUsername(B, "ana_p"));
await expectDenied("B sobrescribe la reserva de A", () => setDoc(doc(B.db, "usernames", "ana_p"), { uid: B.uid, creadoEn: serverTimestamp() }));
await expectDenied("B borra la reserva de A", () => deleteDoc(doc(B.db, "usernames", "ana_p")));
await expectDenied("B se pone @ana_p en su perfil sin reservarlo", () => updateDoc(doc(B.db, "usuarios", B.uid), { username: "ana_p", usernameNormalized: "ana_p", actualizadoEn: serverTimestamp() }));
await expectDenied("B se pone un username que nadie reservó", () => updateDoc(doc(B.db, "usuarios", B.uid), { username: "beto", usernameNormalized: "beto", actualizadoEn: serverTimestamp() }));
await expectDenied("B reserva un username sin ponerlo en su perfil", () => setDoc(doc(B.db, "usernames", "beto_suelto"), { uid: B.uid, creadoEn: serverTimestamp() }));
await expectDenied("B reserva a nombre de A", () => runTransaction(B.db, async (t) => {
  t.set(doc(B.db, "usernames", "beto_x"), { uid: A.uid, creadoEn: serverTimestamp() });
  t.update(doc(B.db, "usuarios", B.uid), { username: "beto_x", usernameNormalized: "beto_x", actualizadoEn: serverTimestamp() });
}));
await expectDenied("B reserva con mayúsculas", () => claimUsername(B, "Beto"));
await expectDenied("B reserva con espacios", () => claimUsername(B, "be to"));
await expectDenied("B reserva un nombre reservado (admin)", () => claimUsername(B, "admin"));
await expectDenied("B reserva uno de 2 caracteres", () => claimUsername(B, "bb"));
await expectDenied("B reserva uno sin letras", () => claimUsername(B, "1234"));
await expectOk("B reserva @beto", () => claimUsername(B, "beto"));
await expectOk("A cambia a @ana_perez y libera @ana_p", async () => {
  await claimUsername(A, "ana_perez");
  if ((await getDoc(doc(A.db, "usernames", "ana_p"))).exists()) throw new Error("no se liberó");
});
await expectOk("C toma @ana_p, que quedó libre", () => claimUsername(C, "ana_p"));
await expectDenied("A quita su username del perfil", () => updateDoc(doc(A.db, "usuarios", A.uid), { username: deleteField(), usernameNormalized: deleteField(), actualizadoEn: serverTimestamp() }));
await expectDenied("A cambia solo el username visible (distinto del normalizado)", () => updateDoc(doc(A.db, "usuarios", A.uid), { username: "Ana_Perez", actualizadoEn: serverTimestamp() }));
await expectDenied("A libera su reserva sin cambiar de username", () => deleteDoc(doc(A.db, "usernames", "ana_perez")));
await expectOk("guardar el perfil no toca el username", async () => {
  await saveProfile(A, profileDoc("Ana P.", { nombreNormalizado: "ana p." }));
  if ((await getDoc(doc(A.db, "usuarios", A.uid))).data().usernameNormalized !== "ana_perez") throw new Error("se perdió");
});
await expectOk("B busca personas por prefijo de username", async () => {
  const r = await getDocs(query(collection(B.db, "usuarios"), where("usernameNormalized", ">=", "ana"), where("usernameNormalized", "<=", "ana"), orderBy("usernameNormalized"), limit(12)));
  if (r.size !== 2) throw new Error(`encontró ${r.size}`);
});
await expectOk("B busca personas por prefijo de nombre", async () => {
  const r = await getDocs(query(collection(B.db, "usuarios"), where("nombreNormalizado", ">=", "ana"), where("nombreNormalizado", "<=", "ana"), orderBy("nombreNormalizado"), limit(12)));
  if (r.size !== 1) throw new Error(`encontró ${r.size}`);
});
await expectDenied("B guarda un nombre normalizado de 31 caracteres", () => saveProfile(B, profileDoc("Beto", { nombreNormalizado: "x".repeat(31) })));

// ── MEMBRESÍAS ──────────────────────────────────────────────────────────────
const membresia = { plan: "premium", venceEn: new Date("2030-01-01") };
await expectDenied("A se da Premium a sí misma", () => setDoc(doc(A.db, "membresias", A.uid), membresia));
await expectDenied("A le da Premium a B", () => setDoc(doc(A.db, "membresias", B.uid), membresia));
await expectOk("un admin concede Premium a A (consola, sin reglas)", async () => {
  const res = await fetch(`http://127.0.0.1:${FIRESTORE_PORT}/v1/projects/${PROJECT}/databases/(default)/documents/membresias/${A.uid}`, {
    method: "PATCH", headers: { "content-type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: { plan: { stringValue: "premium" }, venceEn: { timestampValue: "2030-01-01T00:00:00Z" } } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});
await expectOk("B ve la membresía de A (para la insignia)", async () => { if ((await getDoc(doc(B.db, "membresias", A.uid))).data()?.plan !== "premium") throw new Error("no se ve"); });
await expectDenied("A extiende su propia membresía", () => updateDoc(doc(A.db, "membresias", A.uid), { venceEn: new Date("2099-01-01") }));
await expectDenied("B revoca la membresía de A", () => deleteDoc(doc(B.db, "membresias", A.uid)));

// ── SEGUIDORES ──────────────────────────────────────────────────────────────
const follower = (owner, by) => doc(by.db, "usuarios", owner.uid, "seguidores", by.uid);
await expectOk("B sigue a A", () => setDoc(follower(A, B), { creadoEn: serverTimestamp() }));
await expectOk("A ve cuántos la siguen", async () => { if ((await getDocs(collection(A.db, "usuarios", A.uid, "seguidores"))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A se sigue a sí misma", () => setDoc(follower(A, A), { creadoEn: serverTimestamp() }));
await expectDenied("A agrega a B como seguidora de B", () => setDoc(doc(A.db, "usuarios", B.uid, "seguidores", B.uid), { creadoEn: serverTimestamp() }));
await expectDenied("A quita a B de sus seguidores", () => deleteDoc(doc(A.db, "usuarios", A.uid, "seguidores", B.uid)));
await expectDenied("B sigue con un campo extra", () => setDoc(follower(A, B), { creadoEn: serverTimestamp(), extra: 1 }));
await expectOk("B deja de seguir a A", () => deleteDoc(follower(A, B)));

// ── SIGUIENDO ───────────────────────────────────────────────────────────────
const following = (by, owner) => doc(by.db, "usuarios", by.uid, "siguiendo", owner.uid);
await expectOk("B guarda que sigue a A", () => setDoc(following(B, A), { creadoEn: serverTimestamp() }));
await expectOk("B ve a quién sigue", async () => { if ((await getDocs(collection(B.db, "usuarios", B.uid, "siguiendo"))).size !== 1) throw new Error("cantidad"); });
await expectOk("A ve a quién sigue B (pestaña Seguidos)", async () => { if ((await getDocs(collection(A.db, "usuarios", B.uid, "siguiendo"))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A se guarda como seguida de sí misma", () => setDoc(following(A, A), { creadoEn: serverTimestamp() }));
await expectDenied("A escribe en el siguiendo de B", () => setDoc(doc(A.db, "usuarios", B.uid, "siguiendo", A.uid), { creadoEn: serverTimestamp() }));
await expectDenied("B guarda con un campo extra", () => setDoc(following(B, A), { creadoEn: serverTimestamp(), extra: 1 }));
await expectOk("B deja de seguir a A (siguiendo)", () => deleteDoc(following(B, A)));

// ── PUBLICACIONES ───────────────────────────────────────────────────────────
await expectOk("A publica una venta (sin reseñas)", () => createProduct(A, "p-venta"));
await expectOk("A publica una donación (sin precio)", () => createProduct(A, "p-dona", { category: "donacion", price: 0 }));
await expectOk("A publica con foto https de Cloudinary", () => createProduct(A, "p-foto", { imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/x.png" }));
await expectDenied("A publica a nombre de B", () => createProduct(A, "p-x1", { ownerId: B.uid }));
await expectDenied("A publica con estrellas infladas", () => createProduct(A, "p-x2", { resenasTotal: 25, resenasCount: 5 }));
await expectDenied("A publica con el 5.0 inicial de antes", () => createProduct(A, "p-x3", { ratingTotal: 5, ratingCount: 1 }));
await expectOk("C publica con 4 fotos y productos (como la app)", () => createProduct(C, "p-sabores", {
  category: "comida", imageUrl: "https://res.cloudinary.com/demo/a.png",
  imagenes: ["https://res.cloudinary.com/demo/a.png", "https://res.cloudinary.com/demo/b.png", "https://res.cloudinary.com/demo/c.png", "https://res.cloudinary.com/demo/d.png"],
  opciones: [{ id: "o1", nombre: "Cola", precio: 20, imagenUrl: null }, { id: "o2", nombre: "Limón", precio: 18, imagenUrl: "https://res.cloudinary.com/demo/l.png" }],
}));
await expectDenied("A publica con 5 fotos", () => createProduct(A, "p-x10", { imagenes: Array(5).fill("https://res.cloudinary.com/demo/a.png") }));
await expectDenied("A publica con una foto http entre las fotos", () => createProduct(A, "p-x11", { imagenes: ["https://res.cloudinary.com/demo/a.png", "http://x.com/b.png"] }));
await expectDenied("A publica con 11 productos", () => createProduct(A, "p-x12", { opciones: Array(11).fill({ id: "o", nombre: "x", precio: 1, imagenUrl: null }) }));
await expectDenied("A publica con precio negativo", () => createProduct(A, "p-x4", { price: -1 }));
await expectDenied("A publica con campo extra", () => createProduct(A, "p-x5", { destacado: true }));
await expectOk("C publica con ubicación (como la app)", () => createProduct(C, "p-ubicacion", { ubicacion: "Edificio B" }));
await expectDenied("A publica con ubicación vacía", () => createProduct(A, "p-x13", { ubicacion: "" }));
await expectDenied("A publica con ubicación de más de 40 letras", () => createProduct(A, "p-x14", { ubicacion: "x".repeat(41) }));
await expectOk("B publica con cantidad disponible (como la app)", () => createProduct(B, "p-cant", { availableQuantity: 3 }));
await expectDenied("A publica con cantidad 0", () => createProduct(A, "p-x6", { availableQuantity: 0 }));
await expectDenied("A publica con cantidad decimal", () => createProduct(A, "p-x7", { availableQuantity: 1.5 }));
await expectDenied("A publica con foto http", () => createProduct(A, "p-x6", { imageUrl: "http://x.com/a.png" }));
await expectDenied("A publica con categoría inventada", () => createProduct(A, "p-x7", { category: "armas" }));
await expectDenied("A publica con nombre de 41 caracteres", () => createProduct(A, "p-x8", { name: "n".repeat(41) }));
await expectDenied("A publica con fecha falsa", () => createProduct(A, "p-x9", { creadoEn: new Date("2020-01-01") }));
await expectOk("B lee la publicación de A", async () => { if (!(await getDoc(doc(B.db, "productos", "p-venta"))).exists()) throw new Error("no existe"); });
await expectOk("B lista las publicaciones", async () => { if ((await getDocs(collection(B.db, "productos"))).size < 3) throw new Error("faltan"); });
await expectOk("consulta por dueño (perfil público)", async () => { if ((await getDocs(query(collection(B.db, "productos"), where("ownerId", "==", A.uid)))).size !== 3) throw new Error("cantidad distinta"); });
await expectDenied("B borra la publicación de A", () => deleteDoc(doc(B.db, "productos", "p-venta")));
// La dueña sí puede borrar (la app lo ofrece con "Eliminar"); se prueba con una aparte para no
// dejar sin publicación al resto de las pruebas
await expectOk("A borra su publicación", async () => { await createProduct(A, "p-borrar"); await deleteDoc(doc(A.db, "productos", "p-borrar")); });
await expectDenied("B cambia el precio de A", () => updateDoc(doc(B.db, "productos", "p-venta"), { price: 1 }));
await expectDenied("B cambia el dueño de la publicación", () => updateDoc(doc(B.db, "productos", "p-venta"), { ownerId: B.uid }));
await expectOk("A renombra el vendedor en sus publicaciones (lote)", async () => {
  const b = writeBatch(A.db);
  for (const id of ["p-venta", "p-dona", "p-foto"]) b.update(doc(A.db, "productos", id), { seller: "Ana Pérez" });
  await b.commit();
});
await expectDenied("B renombra al vendedor de A", () => updateDoc(doc(B.db, "productos", "p-venta"), { seller: "Estafador" }));
await expectDenied("A cambia el vendedor a vacío", () => updateDoc(doc(A.db, "productos", "p-venta"), { seller: "" }));

// ── RESEÑAS ─────────────────────────────────────────────────────────────────
await expectDenied("B reseña sin que el vendedor se lo pida", () => review(B, "p-venta", 5));
await expectDenied("B se pide la calificación a sí mismo", () => askReview(B, "p-venta", B));
await expectDenied("A se pide la calificación a sí misma", () => askReview(A, "p-venta", A));
await expectOk("A le pide la calificación a B", () => askReview(A, "p-venta", B));
await expectOk("B lee su solicitud", async () => { if (!(await getDoc(doc(B.db, "productos", "p-venta", "solicitudes", B.uid))).exists()) throw new Error("no existe"); });
await expectDenied("C lee la solicitud de B", () => getDoc(doc(C.db, "productos", "p-venta", "solicitudes", B.uid)));
await expectDenied("B reseña con 6 estrellas", () => review(B, "p-venta", 6));
await expectDenied("B reseña sin texto", () => review(B, "p-venta", 4, ""));
await expectDenied("B deja la reseña sin sumarla al promedio", () => setDoc(doc(B.db, "productos", "p-venta", "resenas", B.uid), { autor: "B", estrellas: 5, texto: "x", creadoEn: serverTimestamp() }));
await expectDenied("B suma de más al promedio (+5 con una reseña de 1)", () => {
  const b = writeBatch(B.db);
  b.set(doc(B.db, "productos", "p-venta", "resenas", B.uid), { autor: "B", estrellas: 1, texto: "x", creadoEn: serverTimestamp() });
  b.update(doc(B.db, "productos", "p-venta"), { resenasTotal: increment(5), resenasCount: increment(1) });
  return b.commit();
});
await expectOk("B reseña con 4 (como la app)", () => review(B, "p-venta", 4));
await expectOk("el promedio quedó en 4 (4/1)", async () => { const d = (await getDoc(doc(B.db, "productos", "p-venta"))).data(); if (d.resenasTotal !== 4 || d.resenasCount !== 1) throw new Error(`${d.resenasTotal}/${d.resenasCount}`); });
await expectDenied("B reseña otra vez", () => review(B, "p-venta", 5));
await expectDenied("B edita su reseña", () => updateDoc(doc(B.db, "productos", "p-venta", "resenas", B.uid), { estrellas: 5 }));
await expectDenied("C sube el promedio sin reseña", () => updateDoc(doc(C.db, "productos", "p-venta"), { resenasTotal: increment(5), resenasCount: increment(1) }));
await expectDenied("A sube las estrellas de su publicación", () => updateDoc(doc(A.db, "productos", "p-venta"), { resenasTotal: 50 }));
await expectOk("A le pide la calificación a C", () => askReview(A, "p-venta", C));
await expectOk("C reseña con 5", () => review(C, "p-venta", 5));
await expectOk("el promedio quedó en 4.5 (9/2)", async () => { const d = (await getDoc(doc(C.db, "productos", "p-venta"))).data(); if (d.resenasTotal !== 9 || d.resenasCount !== 2) throw new Error(`${d.resenasTotal}/${d.resenasCount}`); });
await expectOk("A le pide la calificación de una donación a B", () => askReview(A, "p-dona", B));
await expectDenied("B reseña una donación", () => review(B, "p-dona", 5));
await expectOk("cualquiera con sesión lee las reseñas", async () => { if ((await getDocs(collection(C.db, "productos", "p-venta", "resenas"))).size !== 2) throw new Error("cantidad"); });

// ── COMENTARIOS ─────────────────────────────────────────────────────────────
const addComment = (u, pid, over = {}) => addDoc(collection(u.db, "productos", pid, "comentarios"), { authorId: u.uid, author: u.label, text: "Hola", creadoEn: serverTimestamp(), ...over });
await expectOk("B comenta", () => addComment(B, "p-venta"));
await expectOk("A lee los comentarios", async () => { if ((await getDocs(collection(A.db, "productos", "p-venta", "comentarios"))).size !== 1) throw new Error("cantidad"); });
await expectDenied("B comenta como A", () => addComment(B, "p-venta", { authorId: A.uid }));
await expectDenied("B comenta vacío", () => addComment(B, "p-venta", { text: "" }));
await expectDenied("B comenta con 501 caracteres", () => addComment(B, "p-venta", { text: "x".repeat(501) }));
await expectDenied("B comenta con campo extra", () => addComment(B, "p-venta", { fijado: true }));
await expectDenied("B edita un comentario", async () => { const s = await getDocs(collection(B.db, "productos", "p-venta", "comentarios")); await updateDoc(s.docs[0].ref, { text: "editado" }); });
await expectDenied("B borra un comentario", async () => { const s = await getDocs(collection(B.db, "productos", "p-venta", "comentarios")); await deleteDoc(s.docs[0].ref); });

// ── FAVORITOS ───────────────────────────────────────────────────────────────
await expectOk("B marca favorito", () => setDoc(doc(B.db, "usuarios", B.uid, "favoritos", "p-venta"), { productId: "p-venta", creadoEn: serverTimestamp() }));
await expectOk("B marca el mismo favorito otra vez (doble toque)", () => setDoc(doc(B.db, "usuarios", B.uid, "favoritos", "p-venta"), { productId: "p-venta", creadoEn: serverTimestamp() }));
await expectOk("B lee sus favoritos", async () => { if ((await getDocs(collection(B.db, "usuarios", B.uid, "favoritos"))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A lee los favoritos de B", () => getDocs(collection(A.db, "usuarios", B.uid, "favoritos")));
await expectDenied("A escribe en los favoritos de B", () => setDoc(doc(A.db, "usuarios", B.uid, "favoritos", "p-dona"), { productId: "p-dona", creadoEn: serverTimestamp() }));
await expectDenied("B guarda un favorito con otro id", () => setDoc(doc(B.db, "usuarios", B.uid, "favoritos", "p-dona"), { productId: "otro", creadoEn: serverTimestamp() }));
await expectOk("B quita el favorito", () => deleteDoc(doc(B.db, "usuarios", B.uid, "favoritos", "p-venta")));

// ── TARJETAS ────────────────────────────────────────────────────────────────
const tarjeta = { institucion: "BBVA", clave: "012180001234567891", beneficiario: "BETO RUIZ", color: "rojo" };
const tarjetasDe = (u, uid = u.uid) => collection(u.db, "usuarios", uid, "tarjetas");
let tarjetaB;
await expectOk("B guarda una tarjeta", async () => { tarjetaB = await addDoc(tarjetasDe(B), { ...tarjeta, creadoEn: serverTimestamp() }); });
await expectOk("B lee sus tarjetas", async () => { if ((await getDocs(query(tarjetasDe(B), orderBy("creadoEn", "asc")))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A lee las tarjetas de B", () => getDocs(tarjetasDe(A, B.uid)));
await expectDenied("A guarda una tarjeta en la colección de B", () => addDoc(tarjetasDe(A, B.uid), { ...tarjeta, creadoEn: serverTimestamp() }));
await expectDenied("B guarda una tarjeta con CVV", () => addDoc(tarjetasDe(B), { ...tarjeta, cvv: "123", creadoEn: serverTimestamp() }));
await expectDenied("B guarda una clave con letras", () => addDoc(tarjetasDe(B), { ...tarjeta, clave: "0121800012345678ab", creadoEn: serverTimestamp() }));
await expectDenied("B guarda una clave de 16 dígitos", () => addDoc(tarjetasDe(B), { ...tarjeta, clave: "4111111111112455", creadoEn: serverTimestamp() }));
await expectDenied("B guarda una tarjeta con vencimiento", () => addDoc(tarjetasDe(B), { ...tarjeta, vence: "08/29", creadoEn: serverTimestamp() }));
await expectDenied("B guarda un color que no existe", () => addDoc(tarjetasDe(B), { ...tarjeta, color: "dorado", creadoEn: serverTimestamp() }));
await expectDenied("B guarda la tarjeta en gris (sin diseño)", () => addDoc(tarjetasDe(B), { ...tarjeta, color: "gris", creadoEn: serverTimestamp() }));
await expectOk("B edita su tarjeta", () => updateDoc(tarjetaB, { institucion: "NU", clave: "638180000123456789", beneficiario: "BETO R", color: "amarillo" }));
await expectDenied("B le agrega el CVV al editar", () => updateDoc(tarjetaB, { cvv: "123" }));
await expectDenied("B cambia la fecha de creación", () => updateDoc(tarjetaB, { creadoEn: serverTimestamp() }));
await expectDenied("A edita la tarjeta de B", () => updateDoc(doc(A.db, "usuarios", B.uid, "tarjetas", tarjetaB.id), { beneficiario: "A" }));
await expectDenied("A borra la tarjeta de B", () => deleteDoc(doc(A.db, "usuarios", B.uid, "tarjetas", tarjetaB.id)));
await expectOk("B borra su tarjeta", () => deleteDoc(tarjetaB));

// ── REPORTES ────────────────────────────────────────────────────────────────
await expectOk("B reporta", () => setDoc(doc(B.db, "reportes", `${B.uid}_p-venta`), { productId: "p-venta", reporterId: B.uid, creadoEn: serverTimestamp() }));
await expectOk("B lee sus reportes (consulta)", async () => { if ((await getDocs(query(collection(B.db, "reportes"), where("reporterId", "==", B.uid)))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A lee los reportes de B", () => getDoc(doc(A.db, "reportes", `${B.uid}_p-venta`)));
await expectDenied("A lista los reportes de B (consulta)", () => getDocs(query(collection(A.db, "reportes"), where("reporterId", "==", B.uid))));
await expectDenied("A lista todos los reportes", () => getDocs(collection(A.db, "reportes")));
await expectDenied("B reporta a nombre de A", () => setDoc(doc(B.db, "reportes", `${A.uid}_p-dona`), { productId: "p-dona", reporterId: A.uid, creadoEn: serverTimestamp() }));
await expectDenied("B reporta con id que no cuadra", () => setDoc(doc(B.db, "reportes", "cualquiera"), { productId: "p-dona", reporterId: B.uid, creadoEn: serverTimestamp() }));
await expectDenied("B edita su reporte", () => updateDoc(doc(B.db, "reportes", `${B.uid}_p-venta`), { productId: "otro" }));
await expectDenied("B borra su reporte", () => deleteDoc(doc(B.db, "reportes", `${B.uid}_p-venta`)));

// ── NOTIFICACIONES ──────────────────────────────────────────────────────────
// Como sendNotification: el id es fijo por persona y motivo, y la escribe quien la provoca.
const notifRef = (to, by, id) => doc(by.db, "usuarios", to.uid, "notificaciones", id);
const notif = (by, tipo, extra = {}) => ({ tipo, actorId: by.uid, actorNombre: by.label, actorFoto: null, actorOrbe: null, leida: false, creadoEn: serverTimestamp(), ...extra });
const followNotif = `seguidor_${B.uid}`;
await expectOk("B avisa a A de que la sigue", () => setDoc(notifRef(A, B, followNotif), notif(B, "seguidor")));
await expectOk("B renueva el mismo aviso (volvió a seguir)", () => setDoc(notifRef(A, B, followNotif), notif(B, "seguidor", { actorOrbe: 3 })));
await expectOk("B avisa de un favorito", () => setDoc(notifRef(A, B, `favorito_${B.uid}_p-venta`), notif(B, "favorito", { productId: "p-venta", productName: "Calculadora" })));
await expectOk("B avisa de un comentario con extracto", () => setDoc(notifRef(A, B, `comentario_${B.uid}_p-venta`), notif(B, "comentario", { productId: "p-venta", productName: "Calculadora", texto: "Hola" })));
await expectOk("B avisa de un mensaje", () => setDoc(notifRef(A, B, `mensaje_${B.uid}`), notif(B, "mensaje", { chatId: chatIdFor(A.uid, B.uid), texto: "Hola", actorFoto: "https://res.cloudinary.com/demo/image/upload/v1/b.png" })));
await expectOk("A lee sus notificaciones", async () => { if ((await getDocs(collection(A.db, "usuarios", A.uid, "notificaciones"))).size !== 4) throw new Error("cantidad"); });
await expectDenied("C lee las notificaciones de A", () => getDocs(collection(C.db, "usuarios", A.uid, "notificaciones")));
await expectDenied("B lee la notificación que envió a A", () => getDoc(notifRef(A, B, followNotif)));
await expectDenied("B se notifica a sí mismo", () => setDoc(notifRef(B, B, followNotif), notif(B, "seguidor")));
await expectDenied("B notifica a nombre de C", () => setDoc(notifRef(A, B, `seguidor_${C.uid}`), notif(C, "seguidor")));
await expectDenied("B usa un id libre (acumular copias)", () => setDoc(notifRef(A, B, "cualquiera"), notif(B, "seguidor")));
await expectDenied("B usa un id de otro producto", () => setDoc(notifRef(A, B, `favorito_${B.uid}_p-dona`), notif(B, "favorito", { productId: "p-venta", productName: "Calculadora" })));
await expectDenied("B envía un tipo desconocido", () => setDoc(notifRef(A, B, `oferta_${B.uid}`), notif(B, "oferta")));
await expectDenied("B envía una ya leída", () => setDoc(notifRef(A, C, `seguidor_${C.uid}`), { ...notif(C, "seguidor"), leida: true }));
await expectDenied("C envía un texto de 121 caracteres", () => setDoc(notifRef(A, C, `mensaje_${C.uid}`), notif(C, "mensaje", { chatId: "x", texto: "x".repeat(121) })));
await expectDenied("C envía una foto http (no https)", () => setDoc(notifRef(A, C, `seguidor_${C.uid}`), notif(C, "seguidor", { actorFoto: "http://x.com/a.png" })));
await expectDenied("C envía un campo extra", () => setDoc(notifRef(A, C, `seguidor_${C.uid}`), notif(C, "seguidor", { enlace: "https://x.com" })));
await expectDenied("C pisa la notificación de B", () => setDoc(notifRef(A, C, followNotif), notif(C, "seguidor")));
await expectOk("A marca una como leída", () => updateDoc(notifRef(A, A, followNotif), { leida: true }));
await expectDenied("A cambia el texto de una notificación", () => updateDoc(notifRef(A, A, `mensaje_${B.uid}`), { texto: "otro" }));
await expectDenied("A la vuelve a marcar como no leída", () => updateDoc(notifRef(A, A, followNotif), { leida: false }));
await expectOk("A marca todas como leídas (lote)", async () => {
  const b = writeBatch(A.db);
  for (const id of [`favorito_${B.uid}_p-venta`, `comentario_${B.uid}_p-venta`, `mensaje_${B.uid}`]) b.update(notifRef(A, A, id), { leida: true });
  await b.commit();
});
await expectOk("B renueva una notificación ya leída (vuelve a quedar sin leer)", () => setDoc(notifRef(A, B, `mensaje_${B.uid}`), notif(B, "mensaje", { chatId: chatIdFor(A.uid, B.uid), texto: "¿Sigue disponible?" })));
await expectDenied("B marca como leída la notificación de A", () => updateDoc(notifRef(A, B, followNotif), { leida: true }));
await expectOk("A borra una notificación", () => deleteDoc(notifRef(A, A, followNotif)));
await expectDenied("B borra una notificación de A", () => deleteDoc(notifRef(A, B, `mensaje_${B.uid}`)));

// ── CHATS ───────────────────────────────────────────────────────────────────
const productInfo = { id: "p-venta", name: "Calculadora" };
const chatAB = chatIdFor(A.uid, B.uid);
await expectOk("B abre chat con A desde un producto (crea chat + mensaje)", () => openChat(B, A, productInfo));
await expectOk("B abre otra vez el mismo producto (no duplica)", () => openChat(B, A, productInfo));
await expectOk("solo hay un mensaje de interés", async () => { if ((await getDocs(collection(B.db, "chats", chatAB, "mensajes"))).size !== 1) throw new Error("cantidad"); });
await expectOk("B abre el chat con otro producto (agrega mensaje)", () => openChat(B, A, { id: "p-dona", name: "Donación" }));
await expectOk("A lista sus chats (consulta)", async () => { const s = await getDocs(query(collection(A.db, "chats"), where("participants", "array-contains", A.uid))); if (s.size !== 1) throw new Error("cantidad " + s.size); });
await expectOk("A lee los mensajes del chat", async () => { if ((await getDocs(collection(A.db, "chats", chatAB, "mensajes"))).size !== 2) throw new Error("cantidad"); });
await expectOk("A responde", () => sendMessage(A, chatAB, "Sí, sigue disponible"));
await expectOk("B envía texto y fotos de Cloudinary", () => sendMessage(B, chatAB, "", ["https://res.cloudinary.com/demo/image/upload/v1/a.png"]));
await expectOk("A marca el chat como leído", () => updateDoc(doc(A.db, "chats", chatAB), { [`reads.${A.uid}`]: serverTimestamp() }));
await expectOk("A actualiza su nombre en el chat (lote)", async () => { const b = writeBatch(A.db); b.update(doc(A.db, "chats", chatAB), { [`names.${A.uid}`]: "Ana Pérez" }); await b.commit(); });
await expectDenied("C lee el chat de A y B", () => getDoc(doc(C.db, "chats", chatAB)));
await expectDenied("C lee los mensajes de A y B", () => getDocs(collection(C.db, "chats", chatAB, "mensajes")));
await expectDenied("C escribe un mensaje en el chat de A y B", () => sendMessage(C, chatAB, "intruso"));
await expectDenied("C lista chats ajenos (consulta por A)", () => getDocs(query(collection(C.db, "chats"), where("participants", "array-contains", A.uid))));
await expectDenied("C modifica el chat", () => updateDoc(doc(C.db, "chats", chatAB), { [`reads.${C.uid}`]: serverTimestamp() }));
await expectDenied("A cambia el nombre de B en el chat", () => updateDoc(doc(A.db, "chats", chatAB), { [`names.${B.uid}`]: "Falso" }));
await expectDenied("A marca como leído a nombre de B", () => updateDoc(doc(A.db, "chats", chatAB), { [`reads.${B.uid}`]: serverTimestamp() }));
await expectDenied("A cambia los participantes", () => updateDoc(doc(A.db, "chats", chatAB), { participants: [A.uid, C.uid].sort() }));
await expectDenied("A falsea el último mensaje como de B", () => updateDoc(doc(A.db, "chats", chatAB), { lastMessage: { text: "falso", from: B.uid, hasImages: false, time: serverTimestamp() } }));
await expectDenied("A escribe un mensaje como si fuera B", async () => { await addDoc(collection(A.db, "chats", chatAB, "mensajes"), { from: B.uid, text: "falso", images: [], creadoEn: serverTimestamp() }); });
await expectDenied("A edita un mensaje", async () => { const s = await getDocs(collection(A.db, "chats", chatAB, "mensajes")); await updateDoc(s.docs[0].ref, { text: "editado" }); });
await expectDenied("A borra un mensaje", async () => { const s = await getDocs(collection(A.db, "chats", chatAB, "mensajes")); await deleteDoc(s.docs[0].ref); });
const mensajesAB = (await getDocs(collection(A.db, "chats", chatAB, "mensajes"))).docs;
await expectOk("A elimina un mensaje solo para sí (como la app)", () => updateDoc(doc(A.db, "chats", chatAB, "mensajes", mensajesAB[0].id), { ocultoPara: arrayUnion(A.uid) }));
await expectOk("B elimina el mismo mensaje para sí", () => updateDoc(doc(B.db, "chats", chatAB, "mensajes", mensajesAB[0].id), { ocultoPara: arrayUnion(B.uid) }));
await expectDenied("A elimina un mensaje a nombre de B", () => updateDoc(doc(A.db, "chats", chatAB, "mensajes", mensajesAB[1].id), { ocultoPara: arrayUnion(B.uid) }));
await expectDenied("A lo elimina para sí y de paso lo edita", () => updateDoc(doc(A.db, "chats", chatAB, "mensajes", mensajesAB[1].id), { ocultoPara: arrayUnion(A.uid), text: "editado" }));
await expectDenied("C elimina un mensaje de A y B para sí", () => updateDoc(doc(C.db, "chats", chatAB, "mensajes", mensajesAB[1].id), { ocultoPara: arrayUnion(C.uid) }));
const mandarPedido = (u, pedido) => addDoc(collection(u.db, "chats", chatAB, "mensajes"), { from: u.uid, text: "🧾 Pedido", images: [], pedido, creadoEn: serverTimestamp() });
const pedidoB = { productoId: "p-venta", producto: "Calculadora", items: [{ nombre: "Calculadora", precio: 280, cantidad: 1 }], total: 280, metodo: "efectivo", nota: "En el edificio B" };
await expectOk("B manda un pedido (como la app)", () => mandarPedido(B, pedidoB));
await expectDenied("B manda un pedido sin descripción", () => mandarPedido(B, { ...pedidoB, nota: "" }));
await expectDenied("B manda un pedido con un método inventado", () => mandarPedido(B, { ...pedidoB, metodo: "cripto" }));
await expectDenied("B manda un pedido sin productos", () => mandarPedido(B, { ...pedidoB, items: [] }));
const pedirCalificacion = (u, productoId) => addDoc(collection(u.db, "chats", chatAB, "mensajes"), { from: u.uid, text: "⭐", images: [], calificacion: { productoId, producto: "Calculadora" }, creadoEn: serverTimestamp() });
await expectOk("A (vendedora) pide calificación en el chat", () => pedirCalificacion(A, "p-venta"));
await expectDenied("B pide calificación de una publicación ajena", () => pedirCalificacion(B, "p-venta"));
const mandarTarjeta = (u, datos) => addDoc(collection(u.db, "chats", chatAB, "mensajes"), { from: u.uid, text: "💳 Tarjeta para transferir", images: [], tarjeta: datos, creadoEn: serverTimestamp() });
const tarjetaA = { institucion: "BANORTE", clave: "072180001234567891", beneficiario: "ANA PÉREZ", color: "negro" };
await expectOk("A manda una tarjeta (institución, clave y beneficiario)", () => mandarTarjeta(A, tarjetaA));
await expectDenied("A manda una tarjeta con vencimiento", () => mandarTarjeta(A, { ...tarjetaA, vence: "08/29" }));
await expectDenied("A manda una tarjeta con CVV", () => mandarTarjeta(A, { ...tarjetaA, cvv: "123" }));
await expectDenied("A manda una tarjeta sin clave válida", () => mandarTarjeta(A, { ...tarjetaA, clave: "1234" }));
await expectDenied("A borra el chat", () => deleteDoc(doc(A.db, "chats", chatAB)));
await expectDenied("A envía un mensaje vacío", () => sendMessage(A, chatAB, "", []));
await expectDenied("A envía un mensaje de 2001 caracteres", () => sendMessage(A, chatAB, "x".repeat(2001)));
await expectDenied("A crea un chat consigo misma", () => runTransaction(A.db, async (t) => {
  const now = serverTimestamp();
  t.set(doc(A.db, "chats", `${A.uid}_${A.uid}`), { participants: [A.uid, A.uid], names: { [A.uid]: "Ana" }, productId: null, introducedProducts: [], lastMessage: null, reads: { [A.uid]: now }, creadoEn: now, actualizadoEn: now });
}));
await expectDenied("A crea un chat entre B y C", () => runTransaction(A.db, async (t) => {
  const now = serverTimestamp(); const [x, y] = [B.uid, C.uid].sort();
  t.set(doc(A.db, "chats", `${x}_${y}`), { participants: [x, y], names: { [B.uid]: "B", [C.uid]: "C" }, productId: null, introducedProducts: [], lastMessage: null, reads: { [A.uid]: now }, creadoEn: now, actualizadoEn: now });
}));
await expectDenied("A crea un chat con id que no cuadra", () => runTransaction(A.db, async (t) => {
  const now = serverTimestamp(); const [x, y] = [A.uid, C.uid].sort();
  t.set(doc(A.db, "chats", "id-cualquiera"), { participants: [x, y], names: { [A.uid]: "A", [C.uid]: "C" }, productId: null, introducedProducts: [], lastMessage: null, reads: { [A.uid]: now }, creadoEn: now, actualizadoEn: now });
}));
await expectOk("A abre chat con C sin producto (sin mensaje)", () => openChat(A, C, null));

// ── FICHA ANTIGUA (versión anterior guardaba el correo) ──────────────────────
const D = await client("dani");
await fetch(`http://127.0.0.1:${FIRESTORE_PORT}/v1/projects/${PROJECT}/databases/(default)/documents/usuarios/${D.uid}`, {
  method: "PATCH", headers: { "content-type": "application/json", authorization: "Bearer owner" },
  body: JSON.stringify({ fields: { uid: { stringValue: D.uid }, nombre: { stringValue: "Dani" }, correo: { stringValue: "dani@test.mx" }, creadoEn: { timestampValue: "2026-01-01T00:00:00Z" } } }),
});
await expectOk("ficha antigua: la app la completa y le quita el correo (ensureProfile)", () => runTransaction(D.db, async (t) => {
  const ref = doc(D.db, "usuarios", D.uid);
  const s = await t.get(ref);
  if (!s.exists()) throw new Error("no existe");
  t.set(ref, { ...profileDoc("Dani"), correo: deleteField(), actualizadoEn: serverTimestamp() }, { merge: true });
}));
await expectOk("la ficha antigua ya no tiene correo y quedó completa", async () => {
  const d = (await getDoc(doc(D.db, "usuarios", D.uid))).data();
  if ("correo" in d || d.color !== "azul" || !Array.isArray(d.etiquetas)) throw new Error(JSON.stringify(d));
});
const E = await client("eli");
await fetch(`http://127.0.0.1:${FIRESTORE_PORT}/v1/projects/${PROJECT}/databases/(default)/documents/usuarios/${E.uid}`, {
  method: "PATCH", headers: { "content-type": "application/json", authorization: "Bearer owner" },
  body: JSON.stringify({ fields: { uid: { stringValue: E.uid }, nombre: { stringValue: "Eli" }, correo: { stringValue: "eli@test.mx" }, creadoEn: { timestampValue: "2026-01-01T00:00:00Z" } } }),
});
await expectDenied("ficha antigua: guardar sin quitar el correo (sin deleteField)", () => updateDoc(doc(E.db, "usuarios", E.uid), { ...profileDoc("Eli"), actualizadoEn: serverTimestamp() }));

// ── CORREO EN `cuentas/{uid}` (privado, para verlo en la consola) ────────────
// Repite lo que hace accountRepository.ensureAccountEmail: lee y escribe solo si falta o cambió.
const ensureAccountEmail = async (u) => {
  const ref = doc(u.db, "cuentas", u.uid);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().correo === u.user.email) return;
  await setDoc(ref, { uid: u.uid, correo: u.user.email, actualizadoEn: serverTimestamp() });
};
await expectOk("A guarda su correo en cuentas (como ensureAccountEmail)", () => ensureAccountEmail(A));
await expectOk("A repite ensureAccountEmail sin error (ya está guardado)", () => ensureAccountEmail(A));
await expectOk("A lee su correo guardado", async () => {
  const d = (await getDoc(doc(A.db, "cuentas", A.uid))).data();
  if (d.correo !== A.user.email || d.uid !== A.uid) throw new Error(JSON.stringify(d));
});
await expectOk("B guarda su correo en cuentas", () => ensureAccountEmail(B));
await expectDenied("B lee el correo de A", () => getDoc(doc(B.db, "cuentas", A.uid)));
await expectDenied("B lista todas las cuentas", () => getDocs(collection(B.db, "cuentas")));
await expectDenied("B escribe en la cuenta de A", () => setDoc(doc(B.db, "cuentas", A.uid), { uid: A.uid, correo: B.user.email, actualizadoEn: serverTimestamp() }));
await expectDenied("A guarda un correo que no es el suyo", () => setDoc(doc(A.db, "cuentas", A.uid), { uid: A.uid, correo: "otro@test.mx", actualizadoEn: serverTimestamp() }));
await expectDenied("A guarda un campo extra en su cuenta", () => setDoc(doc(A.db, "cuentas", A.uid), { uid: A.uid, correo: A.user.email, admin: true, actualizadoEn: serverTimestamp() }));
await expectDenied("A guarda su cuenta con otro uid", () => setDoc(doc(A.db, "cuentas", A.uid), { uid: B.uid, correo: A.user.email, actualizadoEn: serverTimestamp() }));
await expectDenied("A borra su cuenta", () => deleteDoc(doc(A.db, "cuentas", A.uid)));
await expectDenied("sin sesión: leer cuentas", async () => {
  const anonApp = initializeApp(config, `anon-cuentas-${run}`);
  const anonCuentasDb = getFirestore(anonApp);
  connectFirestoreEmulator(anonCuentasDb, "127.0.0.1", FIRESTORE_PORT);
  await getDoc(doc(anonCuentasDb, "cuentas", A.uid));
});

// ── CUENTA SIN CORREO VERIFICADO ─────────────────────────────────────────────
const U = await client("sinverificar", { verified: false });
await expectDenied("sin verificar: no puede crear su perfil", () => setDoc(doc(U.db, "usuarios", U.uid), { uid: U.uid, ...profileDoc("U"), creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() }));
await expectDenied("sin verificar: no puede guardar su correo en cuentas", () => setDoc(doc(U.db, "cuentas", U.uid), { uid: U.uid, correo: U.user.email, actualizadoEn: serverTimestamp() }));
await expectDenied("sin verificar: no puede leer publicaciones", () => getDocs(collection(U.db, "productos")));
await expectDenied("sin verificar: no puede publicar", () => createProduct(U, "p-sin-verificar"));
await expectDenied("sin verificar: no puede leer chats", () => getDocs(query(collection(U.db, "chats"), where("participants", "array-contains", U.uid))));
await expectOk("al verificar el correo ya puede crear su perfil", async () => {
  await verifyEmail(U.user);
  await ensureProfile(U, "U");
});

// ── SIN SESIÓN ──────────────────────────────────────────────────────────────
const anon = initializeApp(config, `anon-${run}`);
const anonDb = getFirestore(anon);
connectFirestoreEmulator(anonDb, "127.0.0.1", FIRESTORE_PORT);
await expectDenied("sin sesión: leer publicaciones", () => getDocs(collection(anonDb, "productos")));
await expectDenied("sin sesión: leer perfiles", () => getDoc(doc(anonDb, "usuarios", A.uid)));
await expectDenied("sin sesión: crear publicación", () => setDoc(doc(anonDb, "productos", "anon"), newProduct(A, {})));
await expectDenied("sin sesión: leer chats", () => getDocs(collection(anonDb, "chats")));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(r.ok ? "  ok " : "FALLA", r.name);
console.log(`\n${results.length - failed.length}/${results.length} correctas, ${failed.length} fallidas`);
process.exit(failed.length ? 1 : 0);
