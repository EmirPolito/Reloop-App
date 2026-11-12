import { useCallback } from "react";

import { useProfile } from "@/features/perfil/ProfileProvider";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { sendNotification } from "../notificationRepository";
import type { NotificationPayload } from "../types";

/**
 * Avisa a otra persona de algo que acaba de hacer la sesión actual (seguirla, guardar o
 * comentar su publicación, escribirle). Es un aviso secundario: nunca falla hacia quien
 * llama ni retrasa la acción principal, y no se avisa a una misma.
 */
export function useNotify() {
  const { uid } = useSessionUser();
  const { name, photo, orb } = useProfile().profile;

  return useCallback(
    (recipientId: string, payload: NotificationPayload) => {
      if (recipientId === uid) return;
      sendNotification(
        recipientId,
        { id: uid, name, photo, orb },
        payload,
      ).catch((error) =>
        console.warn(
          "No se pudo enviar la notificación.",
          describeFirestoreError(error),
        ),
      );
    },
    [uid, name, photo, orb],
  );
}
