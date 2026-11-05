import { useEffect, useState } from "react";

import type { ChatMessage } from "@/features/marketplace/types";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import type { ChatsStatus } from "../ChatProvider";
import { subscribeMessages } from "../chatRepository";

const NO_MESSAGES: ChatMessage[] = [];

interface Thread {
  chatId: string;
  messages: ChatMessage[];
  status: ChatsStatus;
  /** Mensajes que ya había al abrir el chat: solo los siguientes se animan. */
  initialCount: number;
}

/** Mensajes de un chat en tiempo real. */
export function useThreadMessages(chatId: string) {
  const { uid } = useSessionUser();
  const [thread, setThread] = useState<Thread | null>(null);

  useEffect(
    () =>
      subscribeMessages(
        chatId,
        uid,
        (messages) =>
          setThread((current) => ({
            chatId,
            messages,
            status: "ready",
            initialCount:
              current?.chatId === chatId && current.status === "ready"
                ? current.initialCount
                : messages.length,
          })),
        (error) => {
          console.warn("No se pudo leer los mensajes.", describeFirestoreError(error));
          setThread({ chatId, messages: NO_MESSAGES, status: "error", initialCount: 0 });
        },
      ),
    [chatId, uid],
  );

  // Si el chat cambia, lo guardado es del anterior y se ignora hasta que llegue lo nuevo
  const current = thread?.chatId === chatId ? thread : null;
  return {
    messages: current?.messages ?? NO_MESSAGES,
    status: current?.status ?? ("loading" as ChatsStatus),
    initialCount: current?.initialCount ?? 0,
  };
}
