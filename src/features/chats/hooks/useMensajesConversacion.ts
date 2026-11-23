import { useEffect, useState } from "react";

import type { ChatMessage } from "@/features/marketplace/types";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import type { ChatsStatus } from "../ProveedorChats";
import { subscribeMessages } from "../repositorioChats";

const NO_MESSAGES: ChatMessage[] = [];

interface Thread {
  chatId: string;
  messages: ChatMessage[];
  status: ChatsStatus;
}

/** Mensajes de un chat en tiempo real. */
export function useMensajesConversacion(chatId: string, deletedAt = 0) {
  const { uid } = useSessionUser();
  const [thread, setThread] = useState<Thread | null>(null);

  useEffect(
    () =>
      subscribeMessages(
        chatId,
        uid,
        deletedAt,
        (messages) => setThread({ chatId, messages, status: "ready" }),
        (error) => {
          console.warn(
            "No se pudo leer los mensajes.",
            describeFirestoreError(error),
          );
          setThread({
            chatId,
            messages: NO_MESSAGES,
            status: "error",
          });
        },
      ),
    [chatId, uid, deletedAt],
  );

  // Si el chat cambia, lo guardado es del anterior y se ignora hasta que llegue lo nuevo
  const current = thread?.chatId === chatId ? thread : null;
  return {
    messages: current?.messages ?? NO_MESSAGES,
    status: current?.status ?? ("loading" as ChatsStatus),
  };
}
