import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { commitInChunks } from "@/lib/firestoreBatch";
import {
  mapNotification,
  toNotificationDocument,
  type NotificationActor,
} from "./notificationMappers";
import { notificationIdFor } from "./notificationRules";
import type { AppNotification, NotificationPayload } from "./types";

const NOTIFICATIONS_LIMIT = 50;
/** Una notificación "acaba de llegar" si se creó hace menos de esto. */
const ARRIVAL_WINDOW_MS = 2 * 60 * 1000;

/** `usuarios/{uid}/notificaciones/{id}`: las que recibe `uid`. */
function notificationsOf(uid: string) {
  return collection(db, "usuarios", uid, "notificaciones");
}

function isNotification(value: AppNotification | null): value is AppNotification {
  return value !== null;
}

/**
 * Notificaciones de la persona en tiempo real, de la más reciente a la más antigua.
 * `arrivals` son las que llegaron sin leer después de abrir la suscripción (las que ya
 * estaban al abrir la app no cuentan): con ellas se muestra el banner.
 */
export function subscribeNotifications(
  uid: string,
  onData: (notifications: AppNotification[], arrivals: AppNotification[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const recent = query(
    notificationsOf(uid),
    orderBy("creadoEn", "desc"),
    limit(NOTIFICATIONS_LIMIT),
  );
  let isFirst = true;
  return onSnapshot(
    recent,
    (snapshot) => {
      const notifications = snapshot.docs.map(mapNotification).filter(isNotification);
      const arrivals = isFirst
        ? []
        : snapshot
            .docChanges()
            .filter((change) => change.type !== "removed")
            .map((change) => mapNotification(change.doc))
            .filter(isNotification)
            .filter(
              (item) =>
                !item.read && Date.now() - item.createdAt < ARRIVAL_WINDOW_MS,
            );
      isFirst = false;
      onData(notifications, arrivals);
    },
    onError,
  );
}

/** Deja (o renueva) la notificación de `actor` en la lista de `recipientId`. */
export async function sendNotification(
  recipientId: string,
  actor: NotificationActor,
  payload: NotificationPayload,
): Promise<void> {
  await setDoc(
    doc(notificationsOf(recipientId), notificationIdFor(actor.id, payload)),
    {
      ...toNotificationDocument(actor, payload),
      leida: false,
      creadoEn: serverTimestamp(),
    },
  );
}

export async function markNotificationRead(
  uid: string,
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(notificationsOf(uid), notificationId), { leida: true });
}

export async function markNotificationsRead(
  uid: string,
  notificationIds: string[],
): Promise<void> {
  await commitInChunks(notificationIds, (batch, id) =>
    batch.update(doc(notificationsOf(uid), id), { leida: true }),
  );
}
