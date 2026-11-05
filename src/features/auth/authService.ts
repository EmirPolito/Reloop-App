import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

function getErrorCode(error: unknown): string {
  return (error as { code?: string } | null)?.code ?? "";
}

export async function registrarUsuario(
  nombre: string,
  correo: string,
  contrasena: string,
) {
  const nombreLimpio = nombre.trim();
  const cred = await createUserWithEmailAndPassword(
    auth,
    correo.trim(),
    contrasena,
  );
  await updateProfile(cred.user, { displayName: nombreLimpio });
  // Si el correo no sale ahora, la pantalla de verificación permite reenviarlo
  await sendEmailVerification(cred.user).catch((error) =>
    console.warn("No se pudo enviar el correo de verificación.", error),
  );
  return cred.user;
}

/** Reenvía el correo de verificación a la cuenta con sesión. */
export async function reenviarVerificacion(): Promise<void> {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

/**
 * Vuelve a leer la cuenta para saber si ya abrió el enlace del correo. Al verificarse se
 * renueva el token de acceso: las reglas de Firestore comprueban `email_verified` en él.
 */
export async function comprobarVerificacion(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}

/** Cambia el nombre de la cuenta (el que se usa como respaldo al iniciar sesión). */
export async function actualizarNombre(nombre: string): Promise<void> {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: nombre });
  }
}

export async function iniciarSesion(correo: string, contrasena: string) {
  const cred = await signInWithEmailAndPassword(auth, correo.trim(), contrasena);
  return cred.user;
}

export function cerrarSesion() {
  return signOut(auth);
}

/** Envía el correo de restablecimiento sin revelar si la cuenta existe. */
export async function enviarRecuperacion(correo: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, correo.trim());
  } catch (error) {
    if (getErrorCode(error) === "auth/user-not-found") return;
    throw error;
  }
}

export function mensajeDeError(error: unknown): string {
  switch (getErrorCode(error)) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ese correo ya tiene una cuenta registrada.";
    case "auth/weak-password":
      return "La contraseña es muy débil (mínimo 6 caracteres).";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet.";
    default:
      // Sin mensaje propio (p. ej. `auth/operation-not-allowed` si falta activar el registro): el código queda en consola
      console.warn("Error de autenticación:", error);
      return "Ocurrió un error. Inténtalo de nuevo.";
  }
}
