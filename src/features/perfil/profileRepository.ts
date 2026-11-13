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

const USERS = "usuarios";

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
      onData(snapshot.exists() ? mapProfile(snapshot.data(), fallbackName) : null),
    onError,
  );
}

/**
 * Crea la ficha de la persona si aún no existe (registro, o cuentas anteriores a esta
 * versión). Una ficha antigua se completa y se le retira el correo: las fichas las puede
 * leer cualquier persona con sesión, así que el correo no debe estar ahí.
 */
export async function ensureProfile(uid: string, name: string): Promise<void> {
  const ref = doc(db, USERS, uid);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (!existing.exists()) {
      transaction.set(ref, {
        uid,
        ...toProfileDocument(defaultProfile(name)),
        // Cuenta nueva: al entrar verá la configuración inicial
        onboardingPendiente: true,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      return;
    }
    const data = existing.data();
    if (isCurrentProfileDocument(data)) return;
    transaction.set(
      ref,
      {
        ...toProfileDocument(mapProfile(data, name)),
        correo: deleteField(),
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    );
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
      correo: deleteField(),
      actualizadoEn: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Termina la configuración inicial: el onboarding no vuelve a mostrarse en ningún dispositivo. */
export async function completeOnboarding(uid: string): Promise<void> {
  await updateDoc(doc(db, USERS, uid), {
    onboardingPendiente: deleteField(),
    actualizadoEn: serverTimestamp(),
  });
}
