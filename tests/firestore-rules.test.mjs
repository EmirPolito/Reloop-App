// Pruebas de las reglas de seguridad de Firestore (firestore.rules) con el SDK real contra los emuladores.
// Las escrituras "permitidas" repiten exactamente las que hace la app (repositorios); las "denegadas"
// son intentos de abuso que las reglas deben frenar. Se ejecutan con: npm run test:rules
// (levanta los emuladores de Authentication y Firestore, corre esto y los apaga; necesita Java 21 o superior).
import { initializeApp, setLogLevel } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, sendEmailVerification } from "firebase/auth";
import {
  addDoc, arrayUnion, collection, connectFirestoreEmulator, deleteDoc, deleteField, doc, getDoc,
  getDocs, getFirestore, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";

setLogLevel("silent"); // los rechazos esperados no deben llenar la consola
const PROJECT = "demo-reloop";
const config = { apiKey: "demo", authDomain: "demo", projectId: PROJECT, appId: "1:1:web:1" };
const run = Date.now().toString(36);

// Limpia datos de ejecuciones anteriores
await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
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
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
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

const newProduct = (u, over = {}) => ({
  ownerId: u.uid, seller: u.label, name: "Calculadora", description: "Buena", category: "venta", price: 280,
  imageUrl: null, distance: "0.0 km", ratingTotal: 5, ratingCount: 1, creadoEn: serverTimestamp(), ...over,
});
const createProduct = (u, id, over) => setDoc(doc(u.db, "productos", id), newProduct(u, over));
const rate = (u, productId, rating) => runTransaction(u.db, async (t) => {
  const productRef = doc(u.db, "productos", productId);
  const ratingRef = doc(u.db, "usuarios", u.uid, "calificaciones", productId);
  const [p, prev] = await Promise.all([t.get(productRef), t.get(ratingRef)]);
  const before = prev.exists() ? Number(prev.data().rating) : 0;
  t.update(productRef, {
    ratingTotal: Number(p.data().ratingTotal) - before + rating,
    ratingCount: Number(p.data().ratingCount) + (before === 0 ? 1 : 0),
  });
  t.set(ratingRef, { productId, rating, actualizadoEn: serverTimestamp() });
});
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

// ── SEGUIDORES ──────────────────────────────────────────────────────────────
const follower = (owner, by) => doc(by.db, "usuarios", owner.uid, "seguidores", by.uid);
await expectOk("B sigue a A", () => setDoc(follower(A, B), { creadoEn: serverTimestamp() }));
await expectOk("A ve cuántos la siguen", async () => { if ((await getDocs(collection(A.db, "usuarios", A.uid, "seguidores"))).size !== 1) throw new Error("cantidad"); });
await expectDenied("A se sigue a sí misma", () => setDoc(follower(A, A), { creadoEn: serverTimestamp() }));
await expectDenied("A agrega a B como seguidora de B", () => setDoc(doc(A.db, "usuarios", B.uid, "seguidores", B.uid), { creadoEn: serverTimestamp() }));
await expectDenied("A quita a B de sus seguidores", () => deleteDoc(doc(A.db, "usuarios", A.uid, "seguidores", B.uid)));
await expectDenied("B sigue con un campo extra", () => setDoc(follower(A, B), { creadoEn: serverTimestamp(), extra: 1 }));
await expectOk("B deja de seguir a A", () => deleteDoc(follower(A, B)));

// ── PUBLICACIONES ───────────────────────────────────────────────────────────
await expectOk("A publica una venta (5/1)", () => createProduct(A, "p-venta"));
await expectOk("A publica una donación (0/0, sin precio)", () => createProduct(A, "p-dona", { category: "donacion", price: 0, ratingTotal: 0, ratingCount: 0 }));
await expectOk("A publica con foto https de Cloudinary", () => createProduct(A, "p-foto", { imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/x.png" }));
await expectDenied("A publica a nombre de B", () => createProduct(A, "p-x1", { ownerId: B.uid }));
await expectDenied("A publica un intercambio con calificación 5/1", () => createProduct(A, "p-x2", { category: "cambio", price: 0 }));
await expectDenied("A publica una venta con calificación inflada 5/100", () => createProduct(A, "p-x3", { ratingCount: 100 }));
await expectDenied("A publica con precio negativo", () => createProduct(A, "p-x4", { price: -1 }));
await expectDenied("A publica con campo extra", () => createProduct(A, "p-x5", { destacado: true }));
await expectDenied("A publica con foto http", () => createProduct(A, "p-x6", { imageUrl: "http://x.com/a.png" }));
await expectDenied("A publica con categoría inventada", () => createProduct(A, "p-x7", { category: "armas" }));
await expectDenied("A publica con nombre de 41 caracteres", () => createProduct(A, "p-x8", { name: "n".repeat(41) }));
await expectDenied("A publica con fecha falsa", () => createProduct(A, "p-x9", { creadoEn: new Date("2020-01-01") }));
await expectOk("B lee la publicación de A", async () => { if (!(await getDoc(doc(B.db, "productos", "p-venta"))).exists()) throw new Error("no existe"); });
await expectOk("B lista las publicaciones", async () => { if ((await getDocs(collection(B.db, "productos"))).size < 3) throw new Error("faltan"); });
await expectOk("consulta por dueño (perfil público)", async () => { if ((await getDocs(query(collection(B.db, "productos"), where("ownerId", "==", A.uid)))).size !== 3) throw new Error("cantidad distinta"); });
await expectDenied("B borra la publicación de A", () => deleteDoc(doc(B.db, "productos", "p-venta")));
await expectDenied("A borra su publicación (la app no lo ofrece)", () => deleteDoc(doc(A.db, "productos", "p-venta")));
await expectDenied("B cambia el precio de A", () => updateDoc(doc(B.db, "productos", "p-venta"), { price: 1 }));
await expectDenied("B cambia el dueño de la publicación", () => updateDoc(doc(B.db, "productos", "p-venta"), { ownerId: B.uid }));
await expectOk("A renombra el vendedor en sus publicaciones (lote)", async () => {
  const b = writeBatch(A.db);
  for (const id of ["p-venta", "p-dona", "p-foto"]) b.update(doc(A.db, "productos", id), { seller: "Ana Pérez" });
  await b.commit();
});
await expectDenied("B renombra al vendedor de A", () => updateDoc(doc(B.db, "productos", "p-venta"), { seller: "Estafador" }));
await expectDenied("A cambia el vendedor a vacío", () => updateDoc(doc(A.db, "productos", "p-venta"), { seller: "" }));

// ── CALIFICACIONES ──────────────────────────────────────────────────────────
await expectOk("B califica con 4 (transacción de la app)", () => rate(B, "p-venta", 4));
await expectOk("el promedio quedó en 4.5 (9/2)", async () => { const d = (await getDoc(doc(B.db, "productos", "p-venta"))).data(); if (d.ratingTotal !== 9 || d.ratingCount !== 2) throw new Error(`${d.ratingTotal}/${d.ratingCount}`); });
await expectOk("B cambia su calificación a 2 (no suma un voto)", () => rate(B, "p-venta", 2));
await expectOk("quedó 7/2", async () => { const d = (await getDoc(doc(B.db, "productos", "p-venta"))).data(); if (d.ratingTotal !== 7 || d.ratingCount !== 2) throw new Error(`${d.ratingTotal}/${d.ratingCount}`); });
await expectOk("C califica con 5", () => rate(C, "p-venta", 5));
await expectDenied("A califica su propia publicación", () => rate(A, "p-venta", 5));
await expectDenied("B califica una donación", () => rate(B, "p-dona", 5));
await expectDenied("B sube el total sin dejar su calificación", () => updateDoc(doc(B.db, "productos", "p-foto"), { ratingTotal: 50, ratingCount: 2 }));
await expectDenied("B suma un voto de más (+2 en vez de +calificación)", async () => {
  const b = writeBatch(B.db);
  b.update(doc(B.db, "productos", "p-foto"), { ratingTotal: 5 + 5 + 5, ratingCount: 2 });
  b.set(doc(B.db, "usuarios", B.uid, "calificaciones", "p-foto"), { productId: "p-foto", rating: 5, actualizadoEn: serverTimestamp() });
  await b.commit();
});
await expectDenied("B califica con 6", () => runTransaction(B.db, async (t) => {
  t.update(doc(B.db, "productos", "p-foto"), { ratingTotal: 11, ratingCount: 2 });
  t.set(doc(B.db, "usuarios", B.uid, "calificaciones", "p-foto"), { productId: "p-foto", rating: 6, actualizadoEn: serverTimestamp() });
}));
await expectDenied("B califica con 0 decimal 4.5", () => runTransaction(B.db, async (t) => {
  t.update(doc(B.db, "productos", "p-foto"), { ratingTotal: 9.5, ratingCount: 2 });
  t.set(doc(B.db, "usuarios", B.uid, "calificaciones", "p-foto"), { productId: "p-foto", rating: 4.5, actualizadoEn: serverTimestamp() });
}));
await expectDenied("A lee las calificaciones de B", () => getDocs(collection(A.db, "usuarios", B.uid, "calificaciones")));
await expectOk("B lee sus calificaciones", async () => { if ((await getDocs(collection(B.db, "usuarios", B.uid, "calificaciones"))).size !== 1) throw new Error("cantidad"); });

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
await fetch(`http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/usuarios/${D.uid}`, {
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
await fetch(`http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/usuarios/${E.uid}`, {
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
  connectFirestoreEmulator(anonCuentasDb, "127.0.0.1", 8080);
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
connectFirestoreEmulator(anonDb, "127.0.0.1", 8080);
await expectDenied("sin sesión: leer publicaciones", () => getDocs(collection(anonDb, "productos")));
await expectDenied("sin sesión: leer perfiles", () => getDoc(doc(anonDb, "usuarios", A.uid)));
await expectDenied("sin sesión: crear publicación", () => setDoc(doc(anonDb, "productos", "anon"), newProduct(A, {})));
await expectDenied("sin sesión: leer chats", () => getDocs(collection(anonDb, "chats")));

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(r.ok ? "  ok " : "FALLA", r.name);
console.log(`\n${results.length - failed.length}/${results.length} correctas, ${failed.length} fallidas`);
process.exit(failed.length ? 1 : 0);
