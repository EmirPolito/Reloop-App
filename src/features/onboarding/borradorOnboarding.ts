import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DatosPerfil } from "@/features/perfil/Perfiltemas";

/**
 * Lo que se eligió en el drawer de bienvenida durante el registro, antes de verificar el
 * correo (las reglas de Firestore no dejan guardar hasta entonces). Se queda en este
 * dispositivo y se sube solo la primera vez que la cuenta entra ya verificada.
 * Las fotos son URIs locales: se suben a Cloudinary al aplicarlo.
 */
export type BorradorOnboarding = Pick<
  DatosPerfil,
  "photo" | "orb" | "cover" | "name" | "description" | "pills"
> & {
  /** @username deseado; solo se validó el formato (la disponibilidad se revisa al subirlo) */
  username: string | null;
};

const clave = (uid: string) => `reloop:onboarding:borrador:${uid}`;

export async function guardarBorrador(
  uid: string,
  borrador: BorradorOnboarding,
): Promise<void> {
  await AsyncStorage.setItem(clave(uid), JSON.stringify(borrador));
}

export async function leerBorrador(
  uid: string,
): Promise<BorradorOnboarding | null> {
  try {
    const guardado = await AsyncStorage.getItem(clave(uid));
    return guardado ? (JSON.parse(guardado) as BorradorOnboarding) : null;
  } catch {
    return null;
  }
}

export function borrarBorrador(uid: string): void {
  AsyncStorage.removeItem(clave(uid)).catch(() => {});
}
