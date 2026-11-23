import { useCallback } from "react";

import { useNavegacion } from "@/features/navigation/useNavegacion";
import { notificationTarget } from "../reglasNotificaciones";
import { useNotificationActions } from "../ProveedorNotificaciones";
import type { AppNotification } from "../tipos";

/** Abre una notificación: la marca como leída y navega a lo que la originó. */
export function useAbrirNotificacion() {
  const { markRead } = useNotificationActions();
  const { openUserProfile, openProduct, openThread } = useNavegacion();

  return useCallback(
    (notification: AppNotification) => {
      if (!notification.read) markRead(notification.id);
      const target = notificationTarget(notification);
      if (!target) return;
      if (target.screen === "user") openUserProfile(target.id);
      else if (target.screen === "product") openProduct(target.id);
      else openThread(target.id);
    },
    [markRead, openUserProfile, openProduct, openThread],
  );
}
