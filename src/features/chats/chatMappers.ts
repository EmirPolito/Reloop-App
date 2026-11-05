import type { DocumentData, DocumentSnapshot } from "firebase/firestore";

import type { Chat, ChatMessage, Product } from "@/features/marketplace/types";
import { toMillis } from "@/lib/firestoreValues";

/** Un chat por pareja de personas: el id sale de sus uid ordenados. */
export function chatIdFor(a: string, b: string): string {
  return [a, b].sort().join("_");
}

export function introMessageFor(product: Pick<Product, "name">): string {
  return `Hola, me interesa "${product.name}".`;
}

/** Chat visto por `uid`: la otra persona, el último mensaje y si hay algo sin leer. */
export function mapChat(
  snapshot: DocumentSnapshot<DocumentData>,
  uid: string,
): Chat | null {
  const data = snapshot.data({ serverTimestamps: "estimate" });
  const participants: unknown = data?.participants;
  if (!data || !Array.isArray(participants)) return null;
  const otherId = String(participants.find((id) => id !== uid) ?? uid);

  const last = data.lastMessage as
    | { text?: string; from?: string; time?: unknown; hasImages?: boolean }
    | null
    | undefined;
  const lastMessage = last
    ? {
        text: typeof last.text === "string" ? last.text : "",
        from: last.from === uid ? ("me" as const) : ("them" as const),
        time: toMillis(last.time),
        hasImages: Boolean(last.hasImages),
      }
    : null;
  const readAt = toMillis((data.reads as Record<string, unknown> | undefined)?.[uid]);

  return {
    id: snapshot.id,
    otherId,
    name: String(data.names?.[otherId] ?? "Usuario"),
    ...(typeof data.productId === "string" ? { productId: data.productId } : {}),
    lastMessage,
    unread: Boolean(lastMessage && lastMessage.from === "them" && lastMessage.time > readAt),
    updatedAt: toMillis(data.actualizadoEn),
  };
}

export function mapMessage(
  snapshot: DocumentSnapshot<DocumentData>,
  uid: string,
): ChatMessage {
  const data = snapshot.data({ serverTimestamps: "estimate" }) ?? {};
  const images = Array.isArray(data.images)
    ? data.images.filter((item): item is string => typeof item === "string")
    : [];
  return {
    id: snapshot.id,
    from: data.from === uid ? "me" : "them",
    text: typeof data.text === "string" ? data.text : "",
    time: toMillis(data.creadoEn),
    ...(images.length > 0 ? { images } : {}),
  };
}
