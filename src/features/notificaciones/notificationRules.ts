import type {
  AppNotification,
  NotificationPayload,
  NotificationTarget,
} from "./types";

export const MAX_NOTIFICATION_TEXT = 120;

/**
 * Id del documento. Es fijo por persona y motivo, así que repetir la acción (seguir, dejar
 * de seguir y volver a seguir; varios mensajes seguidos) actualiza la misma notificación
 * en lugar de acumular copias. Las reglas de Firestore exigen este mismo formato.
 */
export function notificationIdFor(
  actorId: string,
  payload: NotificationPayload,
): string {
  switch (payload.type) {
    case "seguidor":
    case "mensaje":
      return `${payload.type}_${actorId}`;
    case "favorito":
    case "comentario":
      return `${payload.type}_${actorId}_${payload.productId}`;
  }
}

/** Lo que hizo la otra persona, para leer después de su nombre. */
export function notificationMessage(notification: AppNotification): string {
  const product = notification.productName
    ? `"${notification.productName}"`
    : "tu publicación";
  switch (notification.type) {
    case "seguidor":
      return "empezó a seguirte";
    case "favorito":
      return `guardó ${product} en sus favoritos`;
    case "comentario":
      return notification.text
        ? `comentó en ${product}: ${notification.text}`
        : `comentó en ${product}`;
    case "mensaje":
      return notification.text || "te envió un mensaje";
  }
}

/** Título corto con la acción, para el banner (y reutilizable en la lista). */
export function notificationTitle(notification: AppNotification): string {
  switch (notification.type) {
    case "seguidor":
      return "¡Nuevo seguidor!";
    case "favorito":
      return "¡Nuevo favorito!";
    case "comentario":
      return "Nuevo comentario";
    case "mensaje":
      return "Nuevo mensaje";
  }
}

/** Nombre del icono (Ionicons) que acompaña a cada tipo. */
export function notificationIcon(
  notification: AppNotification,
): "person-add" | "heart" | "chatbubble" | "mail" {
  switch (notification.type) {
    case "seguidor":
      return "person-add";
    case "favorito":
      return "heart";
    case "comentario":
      return "chatbubble";
    case "mensaje":
      return "mail";
  }
}

/** Destino al abrir la notificación; `null` si le falta el dato para llegar. */
export function notificationTarget(
  notification: AppNotification,
): NotificationTarget | null {
  switch (notification.type) {
    case "seguidor":
      return { screen: "user", id: notification.actorId };
    case "favorito":
    case "comentario":
      return notification.productId
        ? { screen: "product", id: notification.productId }
        : null;
    case "mensaje":
      return notification.chatId
        ? { screen: "chat", id: notification.chatId }
        : null;
  }
}

/** Texto del contador de la campana: "1", "2"… y "9+" a partir de diez. */
export function unreadBadgeLabel(count: number): string {
  return count > 9 ? "9+" : String(count);
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export interface NotificationSection {
  title: string;
  data: AppNotification[];
}

/** Agrupa por antigüedad (Hoy, Ayer, Esta semana, Anteriores), sin secciones vacías. */
export function groupNotifications(
  notifications: AppNotification[],
  now: number,
): NotificationSection[] {
  const today = startOfDay(now);
  const sections: NotificationSection[] = [
    { title: "Hoy", data: [] },
    { title: "Ayer", data: [] },
    { title: "Esta semana", data: [] },
    { title: "Anteriores", data: [] },
  ];
  for (const notification of notifications) {
    const { createdAt } = notification;
    const index =
      createdAt >= today
        ? 0
        : createdAt >= today - DAY
          ? 1
          : createdAt >= today - 6 * DAY
            ? 2
            : 3;
    sections[index].data.push(notification);
  }
  return sections.filter((section) => section.data.length > 0);
}

/** Antigüedad corta: "ahora", "5 min", "3 h", "2 d" o la fecha. */
export function formatNotificationTime(time: number, now: number): string {
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(time).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}
