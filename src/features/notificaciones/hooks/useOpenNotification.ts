import { useCallback } from "react";

import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { notificationTarget } from "../notificationRules";
import { useNotificationActions } from "../NotificationsProvider";
import type { AppNotification } from "../types";

/** Abre una notificación: la marca como leída y navega a lo que la originó. */
export function useOpenNotification() {
  const { markRead } = useNotificationActions();
  const { openUserProfile, openProduct, openThread } = useAppNavigation();

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
