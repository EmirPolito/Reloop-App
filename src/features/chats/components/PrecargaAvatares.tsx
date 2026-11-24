import { Image } from "expo-image";
import { useEffect, useMemo } from "react";

import type { Chat } from "@/features/marketplace/types";
import { usePerfilesDe } from "@/features/perfil/hooks/usePerfilDe";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { LADO_AVATAR } from "./FilaChat";

/**
 * Lee desde que llegan los chats (no hasta abrir el módulo) el perfil de cada contacto y
 * descarga su foto con el mismo tamaño que pide la fila: al entrar a Chats los avatares ya
 * están y salen de inmediato, sin el círculo vacío ni el fundido. No dibuja nada.
 */
export function PrecargaAvatares({ chats }: { chats: Chat[] }) {
  const contactos = useMemo(
    () => [...new Set(chats.map((chat) => chat.otherId))],
    [chats],
  );
  const perfiles = usePerfilesDe(contactos);

  useEffect(() => {
    const fotos = contactos.flatMap((uid) => {
      const foto = perfiles.get(uid)?.photo;
      // La misma URL que arma `UserAvatar`, para que sea la que quede en caché
      return foto ? [optimizedImageUrl(foto, LADO_AVATAR * 3) ?? foto] : [];
    });
    if (fotos.length > 0) void Image.prefetch(fotos, "memory-disk");
  }, [contactos, perfiles]);

  return null;
}
