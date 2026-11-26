import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Chat } from "@/features/marketplace/types";
import { useNotificar } from "@/features/notificaciones/hooks/useNotificar";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { textoPedido, type Pedido } from "@/features/pedidos/formatoPedido";
import type { TarjetaCompartida } from "@/features/tarjetas/formatoTarjeta";
import { uploadImages } from "@/lib/cloudinary";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import { PrecargaAvatares } from "./components/PrecargaAvatares";
import {
  deleteChatsForMe,
  deleteMessageForMe,
  markChatRead,
  sendMessage as saveMessage,
  subscribeChats,
} from "./repositorioChats";

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
  /** Manda una tarjeta para recibir una transferencia (institución, clave y beneficiario). */
  sendCard: (chatId: string, tarjeta: TarjetaCompartida) => Promise<void>;
  /** Manda el pedido de una publicación de venta o comida. */
  sendOrder: (chatId: string, otherId: string, pedido: Pedido) => Promise<void>;
  /** El vendedor le pide a la otra persona una calificación de su publicación. */
  requestReview: (
    chatId: string,
    producto: { id: string; name: string },
  ) => Promise<void>;
  markRead: (chatId: string) => Promise<void>;
  /** Elimina chats solo para esta persona. */
  deleteChats: (chatIds: string[]) => Promise<void>;
  /** Elimina un mensaje solo para esta persona. */
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
}

/** Texto de los mensajes con tarjeta: es lo que se ve en la lista de chats y en la notificación */
const TEXTO_TARJETA = "💳 Tarjeta para transferir";
const TEXTO_CALIFICACION = "⭐ ¿Me ayudas con una calificación?";

const LOADING: ChatsState = { chats: [], status: "loading" };

const ChatsContext = createContext<ChatsState | null>(null);
const ChatActionsContext = createContext<ChatActions | null>(null);

/** Las conversaciones de la persona, en tiempo real, y las acciones que las modifican. */
export function ChatProvider({ children }: PropsWithChildren) {
  const { uid } = useSessionUser();
  const [state, setState] = useState<ChatsState>(LOADING);
  const chatsRef = useLatestRef(state.chats);
  const notify = useNotificar();

  useEffect(
    () =>
      subscribeChats(
        uid,
        (chats) => setState({ chats, status: "ready" }),
        (error) => {
          console.warn(
            "No se pudo leer los chats.",
            describeFirestoreError(error),
          );
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
        const chat = chatsRef.current.find((item) => item.id === chatId);
        if (chat) {
          notify(chat.otherId, {
            type: "mensaje",
            chatId,
            text: text || "📷 Foto",
          });
        }
      },
      sendCard: async (chatId, { institucion, clave, beneficiario, color }) => {
        const text = TEXTO_TARJETA;
        await saveMessage(chatId, uid, {
          text,
          images: [],
          tarjeta: { institucion, clave, beneficiario, color },
        });
        const chat = chatsRef.current.find((item) => item.id === chatId);
        if (chat) notify(chat.otherId, { type: "mensaje", chatId, text });
      },
      // El chat puede ser recién creado (aún no está en la lista): se pasa la otra persona
      sendOrder: async (chatId, otherId, pedido) => {
        const text = textoPedido(pedido);
        await saveMessage(chatId, uid, { text, images: [], pedido });
        notify(otherId, { type: "mensaje", chatId, text });
      },
      requestReview: async (chatId, producto) => {
        const chat = chatsRef.current.find((item) => item.id === chatId);
        if (!chat) throw new Error("No se encontró la conversación.");
        const text = TEXTO_CALIFICACION;
        const antes = chat.lastMessage;
        await saveMessage(chatId, uid, {
          text,
          images: [],
          // Quien la pide no ve la solicitud: en su lista sigue el mensaje de antes
          ...(antes
            ? {
                previo: {
                  text: antes.text,
                  from: antes.from === "me" ? uid : chat.otherId,
                  hasImages: antes.hasImages,
                  time: antes.time,
                },
              }
            : {}),
          calificacion: {
            productoId: producto.id,
            producto: producto.name,
            compradorId: chat.otherId,
          },
        });
        notify(chat.otherId, { type: "mensaje", chatId, text });
      },
      markRead: (chatId) => markChatRead(chatId, uid),
      deleteChats: (chatIds) => deleteChatsForMe(uid, chatIds),
      deleteMessage: (chatId, messageId) =>
        deleteMessageForMe(chatId, messageId, uid),
    }),
    [uid, chatsRef, notify],
  );

  return (
    <ChatsContext.Provider value={state}>
      <ChatActionsContext.Provider value={actions}>
        <PrecargaAvatares chats={state.chats} />
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
