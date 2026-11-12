import { usePathname } from "expo-router";
import { useEffect } from "react";

import { useOpenNotification } from "../hooks/useOpenNotification";
import {
  useNotificationActions,
  useNotificationArrival,
  useNotifications,
} from "../NotificationsProvider";
import { NotificationBanner } from "./NotificationBanner";

const RUTA_CHAT = "/chat/";

/**
 * Decide cuándo se muestra el banner. Va en el layout de la app, encima de todas las
 * pantallas. No se anuncia lo que ya se está viendo: un mensaje del chat abierto se marca
 * como leído sin banner, y en la pantalla de notificaciones la lista ya se actualiza sola.
 */
export function NotificationBannerHost() {
  const arrival = useNotificationArrival();
  const { notifications } = useNotifications();
  const { markRead, clearArrival } = useNotificationActions();
  const openNotification = useOpenNotification();
  const pathname = usePathname();

  const openChatId = pathname.startsWith(RUTA_CHAT)
    ? decodeURIComponent(pathname.slice(RUTA_CHAT.length))
    : null;
  const yaALaVista =
    arrival !== null &&
    (pathname === "/notificaciones" ||
      (arrival.type === "mensaje" && arrival.chatId === openChatId));

  useEffect(() => {
    if (yaALaVista) clearArrival();
  }, [yaALaVista, clearArrival]);

  // Con el chat abierto, sus mensajes ya se están leyendo
  useEffect(() => {
    if (!openChatId) return;
    for (const item of notifications) {
      if (!item.read && item.type === "mensaje" && item.chatId === openChatId) {
        markRead(item.id);
      }
    }
  }, [openChatId, notifications, markRead]);

  if (!arrival || yaALaVista) return null;

  return (
    <NotificationBanner
      // Una notificación renovada (otro mensaje de la misma persona) vuelve a anunciarse
      key={`${arrival.id}:${arrival.createdAt}`}
      notification={arrival}
      onOpen={() => openNotification(arrival)}
      onDismiss={clearArrival}
    />
  );
}
