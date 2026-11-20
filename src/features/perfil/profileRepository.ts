import {
  deleteField,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { DatosPerfil } from "./Perfiltemas";
import {
  defaultProfile,
  isCurrentProfileDocument,
  mapProfile,
  toProfileDocument,
} from "./profileMappers";
import { sugerirUsername } from "./username";

const USERS = "usuarios";
/** Índice de unicidad de los @username (lo protege `firestore.rules`) */
const USERNAMES = "usernames";

/** Perfil de una persona en tiempo real; `null` si todavía no tiene ficha. */
export function subscribeProfile(
  uid: string,
  onData: (profile: DatosPerfil | null) => void,
  onError: (error: unknown) => void,
  fallbackName = "Usuario",
): Unsubscribe {
  return onSnapshot(
    doc(db, USERS, uid),
    (snapshot) =>
      onData(
        snapshot.exists() ? mapProfile(snapshot.data(), fallbackName) : null,
      ),
    onError,
  );
}

/**
 * Crea la ficha de la persona si aún no existe (registro, o cuentas anteriores a esta
 * versión). Una ficha antigua se completa y se le retira el correo: las fichas las puede
 * leer cualquier persona con sesión, así que el correo no debe estar ahí.
 *
 * Una ficha nueva nace ya con su @username (el sugerido a partir del nombre) y su reserva
 * en `usernames`, en la misma operación: así no hay que esperar a una segunda vuelta al
 * servidor para tenerlo. Devuelve `true` si la ficha ya tiene username; si no (el sugerido
 * estaba ocupado, o es una ficha antigua sin él), lo asigna `ensureUsername`.
 */
export async function ensureProfile(
  uid: string,
  name: string,
): Promise<boolean> {
  const ref = doc(db, USERS, uid);
  const candidato = sugerirUsername(name);
  const reservaRef = doc(db, USERNAMES, candidato);
  return runTransaction(db, async (transaction) => {
    // Las dos lecturas van juntas: no suman tiempo de espera
    const [existing, reserva] = await Promise.all([
      transaction.get(ref),
      transaction.get(reservaRef),
    ]);
    if (!existing.exists()) {
      const libre = !reserva.exists();
      transaction.set(ref, {
        uid,
        ...toProfileDocument(defaultProfile(name)),
        ...(libre
          ? { username: candidato, usernameNormalized: candidato }
          : {}),
        // Cuenta nueva: al entrar verá la configuración inicial
        onboardingPendiente: true,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      if (libre) {
        transaction.set(reservaRef, { uid, creadoEn: serverTimestamp() });
      }
      return libre;
    }
    const data = existing.data();
    const tieneUsername = Boolean(data.usernameNormalized);
    if (isCurrentProfileDocument(data)) return tieneUsername;
    transaction.set(
      ref,
      {
        ...toProfileDocument(mapProfile(data, name)),
        correo: deleteField(),
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    );
    return tieneUsername;
  });
}

/** Guarda los datos editables del perfil (la foto debe ser una URL ya subida). */
export async function saveProfileData(
  uid: string,
  data: DatosPerfil,
): Promise<void> {
  await setDoc(
    doc(db, USERS, uid),
    {
      ...toProfileDocument(data),
      orbe: data.orb ?? deleteField(),
      fondoUrl: data.cover ?? deleteField(),
      tarjetaFondo: data.tarjeta.fondo ?? deleteField(),
      tarjetaTexto: data.tarjeta.texto ?? deleteField(),
      tarjetaImagen: data.tarjeta.imagen ?? deleteField(),
      correo: deleteField(),
      actualizadoEn: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Reporta a una persona (un reporte por pareja: reportar de nuevo no cambia nada). */
export async function reportUser(
  reporterId: string,
  userId: string,
): Promise<void> {
  await setDoc(doc(db, "reportes", `${reporterId}_u_${userId}`), {
    usuarioId: userId,
    reporterId,
    creadoEn: serverTimestamp(),
  });
}

/** Termina la configuración inicial: el onboarding no vuelve a mostrarse en ningún dispositivo. */
export async function completeOnboarding(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    onboardingPendiente: deleteField(),
    actualizadoEn: serverTimestamp(),
  });
}
