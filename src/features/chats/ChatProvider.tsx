import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Chat } from "@/features/marketplace/types";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { uploadImages } from "@/lib/cloudinary";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import {
  markChatRead,
  sendMessage as saveMessage,
  subscribeChats,
} from "./chatRepository";

export type ChatsStatus = "loading" | "ready" | "error";

interface ChatsState {
  /** Del más reciente al más antiguo. */
  chats: Chat[];
  status: ChatsStatus;
}

interface ChatActions {
  /** Sube las fotos a Cloudinary y envía el mensaje. */
  sendMessage: (
    chatId: string,
    content: { text: string; images: string[] },
  ) => Promise<void>;
  markRead: (chatId: string) => Promise<void>;
}

const LOADING: ChatsState = { chats: [], status: "loading" };

const ChatsContext = createContext<ChatsState | null>(null);
const ChatActionsContext = createContext<ChatActions | null>(null);

/** Las conversaciones de la persona, en tiempo real, y las acciones que las modifican. */
export function ChatProvider({ children }: PropsWithChildren) {
  const { uid } = useSessionUser();
  const [state, setState] = useState<ChatsState>(LOADING);

  useEffect(
    () =>
      subscribeChats(
        uid,
        (chats) => setState({ chats, status: "ready" }),
        (error) => {
          console.warn("No se pudo leer los chats.", describeFirestoreError(error));
          setState((current) => ({ ...current, status: "error" }));
        },
      ),
    [uid],
  );

  const actions = useMemo<ChatActions>(
    () => ({
      sendMessage: async (chatId, { text, images }) => {
        const urls = await uploadImages(images);
        await saveMessage(chatId, uid, { text, images: urls });
      },
      markRead: (chatId) => markChatRead(chatId, uid),
    }),
    [uid],
  );

  return (
    <ChatsContext.Provider value={state}>
      <ChatActionsContext.Provider value={actions}>
        {children}
      </ChatActionsContext.Provider>
    </ChatsContext.Provider>
  );
}

export function useChats(): ChatsState {
  return useRequiredContext(ChatsContext, "ChatProvider");
}

export function useChatActions(): ChatActions {
  return useRequiredContext(ChatActionsContext, "ChatProvider");
}
