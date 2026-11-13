// Datos de prueba para ver la app contra los emuladores (nunca contra Firebase real).
// 1) npm run emulators   2) node tests/seed-emulador.mjs   3) inicia la app con
// EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1 e inicia sesión con la cuenta de abajo.
// Crea una cuenta verificada con perfil, @username, membresía Premium y dos publicaciones, y
// otra recién registrada (verificada, sin ficha) para ver el onboarding al entrar.
const PROJECT = "demo-reloop";
const AUTH = "http://127.0.0.1:9099";
const FIRESTORE = `http://127.0.0.1:8085/v1/projects/${PROJECT}/databases/(default)/documents`;

export const CUENTA_DEMO = { correo: "demo@reloop.test", contrasena: "demo1234", nombre: "Emir Demo" };
export const CUENTA_NUEVA = { correo: "nuevo@reloop.test", contrasena: "demo1234", nombre: "Nueva Persona" };

const json = (res) => (res.ok ? res.json() : res.text().then((t) => Promise.reject(new Error(t))));
const admin = { "content-type": "application/json", Authorization: "Bearer owner" };

// Cuenta (o la existente, si ya se sembró antes)
let uid;
const alta = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: CUENTA_DEMO.correo, password: CUENTA_DEMO.contrasena, displayName: CUENTA_DEMO.nombre }),
});
if (alta.ok) uid = (await alta.json()).localId;
else {
  const entrada = await json(await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: CUENTA_DEMO.correo, password: CUENTA_DEMO.contrasena }),
  }));
  uid = entrada.localId;
}
// Correo verificado (las reglas lo exigen)
await json(await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
  method: "POST", headers: admin, body: JSON.stringify({ localId: uid, emailVerified: true }),
}));

const ahora = new Date().toISOString();
const escribir = (ruta, fields) =>
  fetch(`${FIRESTORE}/${ruta}`, { method: "PATCH", headers: admin, body: JSON.stringify({ fields }) }).then(json);
const s = (v) => ({ stringValue: v });

await escribir(`usuarios/${uid}`, {
  uid: s(uid), nombre: s(CUENTA_DEMO.nombre), nombreNormalizado: s("emir demo"),
  username: s("emirdemo"), usernameNormalized: s("emirdemo"), fotoUrl: { nullValue: null }, orbe: { integerValue: "0" },
  descripcion: s("Vendo lo que ya no uso y adopto todo lo que se deja ♻️"), color: s("azul"),
  etiquetas: { arrayValue: { values: [{ mapValue: { fields: { id: s("1"), text: s("UTSV"), color: s("azul") } } }] } },
  stickers: { arrayValue: {} }, creadoEn: { timestampValue: ahora }, actualizadoEn: { timestampValue: ahora },
});
await escribir(`usernames/emirdemo`, { uid: s(uid), creadoEn: { timestampValue: ahora } });
await escribir(`membresias/${uid}`, { plan: s("premium"), venceEn: { timestampValue: "2030-01-01T00:00:00Z" } });
for (const [id, nombre, precio] of [["demo-1", "Calculadora científica", 280], ["demo-2", "Bata de laboratorio", 150]]) {
  await escribir(`productos/${id}`, {
    ownerId: s(uid), seller: s(CUENTA_DEMO.nombre), name: s(nombre), description: s("Casi nueva"), category: s("venta"),
    price: { integerValue: String(precio) }, imageUrl: { nullValue: null }, distance: s("0.0 km"),
    ratingTotal: { integerValue: "5" }, ratingCount: { integerValue: "1" }, creadoEn: { timestampValue: ahora },
  });
}
// Cuenta recién registrada: solo Authentication, con el correo verificado y sin ficha
const nueva = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: CUENTA_NUEVA.correo, password: CUENTA_NUEVA.contrasena, displayName: CUENTA_NUEVA.nombre }),
});
if (nueva.ok) {
  const { localId } = await nueva.json();
  await json(await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
    method: "POST", headers: admin, body: JSON.stringify({ localId, emailVerified: true }),
  }));
}
console.log(`Listo: ${CUENTA_DEMO.correo} (uid ${uid}) y ${CUENTA_NUEVA.correo} (sin perfil, verá el onboarding)`);
