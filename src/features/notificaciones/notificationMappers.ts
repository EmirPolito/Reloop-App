import type { DocumentData, DocumentSnapshot } from "firebase/firestore";

import { isOrb } from "@/constants/orbes";
import { toMillis } from "@/lib/firestoreValues";
import { MAX_NOTIFICATION_TEXT } from "./notificationRules";
import type {
  AppNotification,
  NotificationPayload,
  NotificationType,
} from "./types";

const TYPES: NotificationType[] = [
  "seguidor",
  "favorito",
  "comentario",
  "mensaje",
];

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/** Notificación guardada en Firestore; `null` si el documento no tiene la forma esperada. */
export function mapNotification(
  snapshot: DocumentSnapshot<DocumentData>,
): AppNotification | null {
  const data = snapshot.data({ serverTimestamps: "estimate" });
  if (!data || !TYPES.includes(data.tipo) || typeof data.actorId !== "string") {
    return null;
  }
  const productId = optionalString(data.productId);
  const productName = optionalString(data.productName);
  const chatId = optionalString(data.chatId);
  const text = optionalString(data.texto);
  return {
    id: snapshot.id,
    type: data.tipo,
    actorId: data.actorId,
    actorName: optionalString(data.actorNombre) ?? "Usuario",
    actorPhoto: optionalString(data.actorFoto) ?? null,
    actorOrb: isOrb(data.actorOrbe) ? data.actorOrbe : null,
    ...(productId ? { productId } : {}),
    ...(productName ? { productName } : {}),
    ...(chatId ? { chatId } : {}),
    ...(text ? { text } : {}),
    read: data.leida === true,
    createdAt: toMillis(data.creadoEn),
  };
}

/** Quien provoca la notificación, tal como se muestra a quien la recibe. */
export interface NotificationActor {
  id: string;
  name: string;
  photo: string | null;
  orb: number | null;
}

/** Campos de una notificación nueva (sin `leida` ni la fecha, que pone el repositorio). */
export function toNotificationDocument(
  actor: NotificationActor,
  payload: NotificationPayload,
) {
  const text =
    "text" in payload && payload.text
      ? payload.text.trim().slice(0, MAX_NOTIFICATION_TEXT)
      : "";
  return {
    tipo: payload.type,
    actorId: actor.id,
    actorNombre: actor.name,
    // Solo una foto ya subida: las reglas exigen https
    actorFoto: actor.photo?.startsWith("https://") ? actor.photo : null,
    actorOrbe: actor.orb,
    ...("productId" in payload
      ? { productId: payload.productId, productName: payload.productName }
      : {}),
    ...("chatId" in payload ? { chatId: payload.chatId } : {}),
    ...(text ? { texto: text } : {}),
  };
}
