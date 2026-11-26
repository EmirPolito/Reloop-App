import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import type { Chat, ChatMessage, Product } from "@/features/marketplace/types";
import type { Pedido } from "@/features/pedidos/formatoPedido";
import type { SolicitudCalificacion } from "@/features/resenas/formatoResena";
import { solicitudRef } from "@/features/resenas/repositorioResenas";
import type { TarjetaCompartida } from "@/features/tarjetas/formatoTarjeta";
import { db } from "@/lib/firebase";
import { commitInChunks } from "@/lib/firestoreBatch";
import { chatIdFor, introMessageFor, mapChat, mapMessage } from "./mapeoChats";

const CHATS = "chats";
const MESSAGES = "mensajes";
const MESSAGES_LIMIT = 300;
/** Tope al contar mensajes sin leer: a partir de ahí la lista muestra "+9" */
const MAX_SIN_LEER = 10;

type OnError = (error: unknown) => void;

/** Una de las dos personas de un chat. */
export interface ChatParty {
  id: string;
  name: string;
}

/** Chats de esta persona, del más reciente al más antiguo. */
export function subscribeChats(
  uid: string,
  onData: (chats: Chat[]) => void,
  onError: OnError,
): Unsubscribe {
  const mine = query(
    collection(db, CHATS),
    where("participants", "array-contains", uid),
  );
  return onSnapshot(
    mine,
    (snapshot) =>
      onData(
        snapshot.docs
          .map((item) => mapChat(item, uid))
          .filter((chat): chat is Chat => chat !== null)
          .sort((a, b) => b.updatedAt - a.updatedAt),
      ),
    onError,
  );
}

export function subscribeMessages(
  chatId: string,
  uid: string,
  /** Solo se muestran los mensajes posteriores a esta fecha (la del borrado del chat) */
  deletedAt: number,
  onData: (messages: ChatMessage[]) => void,
  onError: OnError,
): Unsubscribe {
  const messages = query(
    collection(db, CHATS, chatId, MESSAGES),
    orderBy("creadoEn", "asc"),
    limit(MESSAGES_LIMIT),
  );
  return onSnapshot(
    messages,
    (snapshot) =>
      onData(
        snapshot.docs
          // Los que esta persona eliminó para sí ya no se le muestran
          .filter((item) => !esOcultoPara(item.get("ocultoPara"), uid))
          .map((item) => mapMessage(item, uid))
          .filter((message) => message.time > deletedAt),
      ),
    onError,
  );
}

/**
 * Cuántos mensajes de la otra persona llegaron después de `readAt` (se cuentan hasta
 * `MAX_SIN_LEER`), en tiempo real. Los mensajes propios no cuentan.
 */
export function subscribeUnreadCount(
  chatId: string,
  uid: string,
  readAt: number,
  onData: (count: number) => void,
  onError: OnError,
): Unsubscribe {
  const pending = query(
    collection(db, CHATS, chatId, MESSAGES),
    where("creadoEn", ">", Timestamp.fromMillis(readAt)),
    limit(MAX_SIN_LEER),
  );
  return onSnapshot(
    pending,
    (snapshot) =>
      onData(snapshot.docs.filter((item) => item.data().from !== uid).length),
    onError,
  );
}

/**
 * Crea el chat con la otra persona (o reutiliza el existente). Si viene un producto y
 * aún no se le había escrito sobre él, envía el mensaje de interés y lo deja como
 * contexto del chat. Devuelve el id del chat y, si se envió, el mensaje de interés.
 */
export async function openChat(input: {
  me: ChatParty;
  other: ChatParty;
  product: Pick<Product, "id" | "name"> | null;
  /** En false, el chat queda ligado a la publicación sin el mensaje de interés (un pedido) */
  withIntro?: boolean;
}): Promise<{ chatId: string; intro: string | null }> {
  const { me, other, product, withIntro = true } = input;
  const id = chatIdFor(me.id, other.id);
  const chatRef = doc(db, CHATS, id);
  const [firstId, secondId] = [me.id, other.id].sort();

  const sentIntro = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(chatRef);
    const now = serverTimestamp();
    const intro = product && withIntro ? introMessageFor(product) : null;
    const introRef = doc(collection(chatRef, MESSAGES));
    const lastMessage = intro
      ? { text: intro, from: me.id, hasImages: false, time: now }
      : null;

    if (!existing.exists()) {
      transaction.set(chatRef, {
        participants: [firstId, secondId],
        names: { [me.id]: me.name, [other.id]: other.name },
        productId: product?.id ?? null,
        introducedProducts: product ? [product.id] : [],
        lastMessage,
        reads: { [me.id]: now },
        creadoEn: now,
        actualizadoEn: now,
      });
      if (intro) {
        transaction.set(introRef, {
          from: me.id,
          text: intro,
          images: [],
          creadoEn: now,
        });
      }
      return intro;
    }

    const introduced: unknown = existing.data().introducedProducts;
    const alreadyIntroduced =
      Array.isArray(introduced) && product && introduced.includes(product.id);
    // Sin mensaje: solo se cambia la publicación de la que se habla
    if (product && !intro && existing.data().productId !== product.id) {
      transaction.update(chatRef, {
        productId: product.id,
        introducedProducts: arrayUnion(product.id),
        actualizadoEn: now,
      });
      return null;
    }
    if (!product || !intro || alreadyIntroduced) return null;

    transaction.update(chatRef, {
      productId: product.id,
      introducedProducts: arrayUnion(product.id),
      lastMessage,
      [`reads.${me.id}`]: now,
      actualizadoEn: now,
    });
    transaction.set(introRef, {
      from: me.id,
      text: intro,
      images: [],
      creadoEn: now,
    });
    return intro;
  });

  return { chatId: id, intro: sentIntro };
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: {
    text: string;
    images: string[];
    tarjeta?: TarjetaCompartida;
    pedido?: Pedido;
    /** Con la solicitud se le permite a la otra persona (`compradorId`) escribir su reseña */
    calificacion?: SolicitudCalificacion & { compradorId: string };
    /**
     * El último mensaje de antes (`from` con el uid). Va dentro del resumen: quien manda la
     * solicitud de calificación sigue viendo este en la lista de chats
     */
    previo?: { text: string; from: string; hasImages: boolean; time: number };
  },
): Promise<void> {
  const chatRef = doc(db, CHATS, chatId);
  const now = serverTimestamp();
  const batch = writeBatch(db);
  batch.set(doc(collection(chatRef, MESSAGES)), {
    from: senderId,
    text: content.text,
    images: content.images,
    ...(content.tarjeta ? { tarjeta: content.tarjeta } : {}),
    ...(content.pedido ? { pedido: content.pedido } : {}),
    ...(content.calificacion
      ? {
          calificacion: {
            productoId: content.calificacion.productoId,
            producto: content.calificacion.producto,
          },
        }
      : {}),
    creadoEn: now,
  });
  if (content.calificacion) {
    batch.set(
      solicitudRef(
        content.calificacion.productoId,
        content.calificacion.compradorId,
      ),
      { chatId, creadoEn: now },
    );
  }
  batch.update(chatRef, {
    lastMessage: {
      text: content.text,
      from: senderId,
      hasImages: content.images.length > 0,
      time: now,
      ...(content.previo ? { previo: content.previo } : {}),
    },
    [`reads.${senderId}`]: now,
    actualizadoEn: now,
  });
  await batch.commit();
}

export async function markChatRead(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, CHATS, chatId), {
    [`reads.${uid}`]: serverTimestamp(),
  });
}

/**
 * "Elimina" chats solo para esta persona: queda una marca con la fecha y lo anterior deja de
 * verse; si la otra persona escribe después, el chat reaparece solo con lo nuevo.
 */
export async function deleteChatsForMe(
  uid: string,
  chatIds: string[],
): Promise<void> {
  await commitInChunks(chatIds, (batch, id) =>
    batch.update(doc(db, CHATS, id), {
      [`borrados.${uid}`]: serverTimestamp(),
    }),
  );
}

/** Si `uid` está en la lista de quienes eliminaron el mensaje para sí */
function esOcultoPara(ocultoPara: unknown, uid: string): boolean {
  return Array.isArray(ocultoPara) && ocultoPara.includes(uid);
}

/** "Elimina" un mensaje solo para esta persona: la otra lo sigue viendo. */
export async function deleteMessageForMe(
  chatId: string,
  messageId: string,
  uid: string,
): Promise<void> {
  await updateDoc(doc(db, CHATS, chatId, MESSAGES, messageId), {
    ocultoPara: arrayUnion(uid),
  });
}

/** Actualiza el nombre propio en los chats en los que se participa y que aún muestran otro. */
export async function updateMyChatName(me: ChatParty): Promise<void> {
  const mine = await getDocs(
    query(
      collection(db, CHATS),
      where("participants", "array-contains", me.id),
    ),
  );
  const outdated = mine.docs.filter(
    (item) => item.data().names?.[me.id] !== me.name,
  );
  await commitInChunks(outdated, (batch, item) =>
    batch.update(item.ref, { [`names.${me.id}`]: me.name }),
  );
}
