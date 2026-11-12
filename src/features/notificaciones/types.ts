export type NotificationType = "seguidor" | "favorito" | "comentario" | "mensaje";

/** Una notificación recibida, ya convertida desde su documento de Firestore. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Quien la provocó */
  actorId: string;
  actorName: string;
  /** Foto y avatar orbe de esa persona al momento de enviarla */
  actorPhoto: string | null;
  actorOrb: number | null;
  productId?: string;
  productName?: string;
  chatId?: string;
  /** Extracto del comentario o del mensaje */
  text?: string;
  read: boolean;
  createdAt: number;
}

/** Lo que cambia según el tipo, al enviar una notificación. */
export type NotificationPayload =
  | { type: "seguidor" }
  | {
      type: "favorito" | "comentario";
      productId: string;
      productName: string;
      text?: string;
    }
  | { type: "mensaje"; chatId: string; text: string };

/** Pantalla a la que lleva una notificación. */
export type NotificationTarget =
  | { screen: "user"; id: string }
  | { screen: "product"; id: string }
  | { screen: "chat"; id: string };
