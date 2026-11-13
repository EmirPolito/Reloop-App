import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  MENSAJE_INVALIDO,
  normalizarUsername,
  sugerirUsername,
  validarUsername,
} from "./username";

const USERS = "usuarios";
/** Índice de unicidad: `usernames/{username}` → `{ uid }`. Lo protege `firestore.rules`. */
const USERNAMES = "usernames";
/** Intentos con sufijo al asignar un username automático */
const INTENTOS_AUTOMATICOS = 6;

/** Error con un mensaje que se puede mostrar tal cual a la persona */
export class UsernameError extends Error {}

/** `true` si nadie lo usa o ya es de `uid` (lo decide el índice `usernames`) */
export async function isUsernameAvailable(
  username: string,
  uid: string,
): Promise<boolean> {
  const reserva = await getDoc(doc(db, USERNAMES, username));
  return !reserva.exists() || reserva.data().uid === uid;
}

/**
 * Cambia el username de `uid` en una sola transacción: reserva el nuevo en `usernames`,
 * libera el anterior y actualiza el perfil. Si otra persona lo reservó antes, falla con
 * `UsernameError` y no cambia nada. Las reglas exigen que las tres escrituras vayan juntas.
 */
export async function claimUsername(uid: string, deseado: string): Promise<void> {
  const username = normalizarUsername(deseado);
  const motivo = validarUsername(username);
  if (motivo) throw new UsernameError(MENSAJE_INVALIDO[motivo]);

  const perfilRef = doc(db, USERS, uid);
  const nuevaRef = doc(db, USERNAMES, username);

  await runTransaction(db, async (transaction) => {
    const [perfil, reserva] = await Promise.all([
      transaction.get(perfilRef),
      transaction.get(nuevaRef),
    ]);
    if (!perfil.exists()) {
      throw new UsernameError("Tu perfil aún no está listo. Inténtalo de nuevo.");
    }
    if (reserva.exists() && reserva.data().uid !== uid) {
      throw new UsernameError(`@${username} ya está en uso`);
    }
    const anterior = perfil.data().usernameNormalized;
    if (anterior === username) return;

    if (!reserva.exists()) {
      transaction.set(nuevaRef, { uid, creadoEn: serverTimestamp() });
    }
    if (typeof anterior === "string" && anterior) {
      transaction.delete(doc(db, USERNAMES, anterior));
    }
    transaction.update(perfilRef, {
      username,
      usernameNormalized: username,
      actualizadoEn: serverTimestamp(),
    });
  });
}

/**
 * Da un username a quien todavía no tiene (cuentas anteriores a esta función o registros
 * nuevos): primero el derivado del nombre y, si está ocupado, con números al final. No
 * toca un perfil que ya tiene username, aunque se llame desde dos dispositivos a la vez.
 */
export async function ensureUsername(uid: string, nombre: string): Promise<void> {
  const perfil = await getDoc(doc(db, USERS, uid));
  if (!perfil.exists() || perfil.data().usernameNormalized) return;

  for (let intento = 0; intento < INTENTOS_AUTOMATICOS; intento++) {
    const sufijo =
      intento === 0 ? "" : String(Math.floor(1000 + Math.random() * 9000));
    const candidato = sugerirUsername(nombre, sufijo);
    try {
      await runTransaction(db, async (transaction) => {
        const perfilRef = doc(db, USERS, uid);
        const reservaRef = doc(db, USERNAMES, candidato);
        const [actual, reserva] = await Promise.all([
          transaction.get(perfilRef),
          transaction.get(reservaRef),
        ]);
        // Otro dispositivo ya le asignó uno: no hay nada que hacer
        if (!actual.exists() || actual.data().usernameNormalized) return;
        if (reserva.exists()) throw new UsernameError("ocupado");
        transaction.set(reservaRef, { uid, creadoEn: serverTimestamp() });
        transaction.update(perfilRef, {
          username: candidato,
          usernameNormalized: candidato,
          actualizadoEn: serverTimestamp(),
        });
      });
      return;
    } catch (error) {
      // Ocupado: se prueba con otro sufijo. Cualquier otro error se informa
      if (!(error instanceof UsernameError)) throw error;
    }
  }
  throw new Error("No se pudo asignar un username automático.");
}
