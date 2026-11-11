import { actualizarNombre } from "@/features/auth/authService";
import { updateMyChatName } from "@/features/chats/chatRepository";
import { renameSeller } from "@/features/marketplace/productRepository";
import { uploadImage } from "@/lib/cloudinary";
import type { DatosPerfil } from "./Perfiltemas";
import { saveProfileData } from "./profileRepository";

/**
 * Guarda el perfil propio: sube la foto nueva a Cloudinary, replica el nombre en lo que
 * lo muestra (publicaciones y chats) y guarda la ficha. El nombre viaja primero: si algo
 * falla antes de guardar la ficha, el perfil queda intacto y se puede reintentar.
 */
export async function saveOwnProfile(
  uid: string,
  previous: DatosPerfil,
  next: DatosPerfil,
): Promise<void> {
  const data: DatosPerfil = {
    ...next,
    photo: next.photo ? await uploadImage(next.photo) : null,
    cover: next.cover ? await uploadImage(next.cover) : null,
  };
  const renamed = data.name !== previous.name;

  if (renamed) {
    await Promise.all([
      renameSeller(uid, data.name),
      updateMyChatName({ id: uid, name: data.name }),
    ]);
  }
  await saveProfileData(uid, data);

  if (renamed) {
    // El nombre de la cuenta solo sirve de respaldo al iniciar sesión: si falla, no importa
    actualizarNombre(data.name).catch((error) =>
      console.warn("No se pudo actualizar el nombre de la cuenta.", error),
    );
  }
}
