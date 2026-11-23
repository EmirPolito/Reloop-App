import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";

const ACCOUNTS = "cuentas";

/**
 * Deja en `cuentas/{uid}` el correo de la cuenta, para verlo en la consola de Firebase junto
 * a su perfil. No va en `usuarios`: esas fichas las lee cualquier persona con sesión. Solo
 * escribe si falta o cambió, así que iniciar sesión no genera escrituras de más.
 */
export async function ensureAccountEmail(
  uid: string,
  email: string | null,
): Promise<void> {
  if (!email) return;
  const ref = doc(db, ACCOUNTS, uid);
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().correo === email) return;
  await setDoc(ref, { uid, correo: email, actualizadoEn: serverTimestamp() });
}
