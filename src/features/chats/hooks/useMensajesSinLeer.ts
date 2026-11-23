import { useEffect, useState } from "react";

import type { Chat } from "@/features/marketplace/types";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { subscribeUnreadCount } from "../repositorioChats";

/**
 * Cuántos mensajes sin leer tiene cada chat que está sin leer (hasta 10), en tiempo real.
 * Solo se vigilan los chats con algo pendiente; en el resto no hay nada que contar. Un chat
 * sin leer cuyo conteo aún no llega se cuenta como 1.
 */
export function useMensajesSinLeer(chats: Chat[]): Record<string, number> {
  const { uid } = useSessionUser();
  const [conteos, setConteos] = useState<Record<string, number>>({});

  // Qué chats vigilar y desde cuándo: solo cambia cuando cambia de verdad
  const clave = chats
    .filter((chat) => chat.unread)
    .map((chat) => `${chat.id}:${chat.readAt}`)
    .join("|");

  useEffect(() => {
    if (!clave) return;
    const bajas = clave.split("|").map((par) => {
      const separador = par.lastIndexOf(":");
      const id = par.slice(0, separador);
      const readAt = Number(par.slice(separador + 1));
      return subscribeUnreadCount(
        id,
        uid,
        readAt,
        (count) => setConteos((actual) => ({ ...actual, [id]: count })),
        (error) =>
          console.warn(
            "No se pudieron contar los mensajes sin leer.",
            describeFirestoreError(error),
          ),
      );
    });
    return () => bajas.forEach((baja) => baja());
  }, [clave, uid]);

  return conteos;
}
