import { useCallback, useEffect, useState } from "react";

import { useNotify } from "@/features/notificaciones/hooks/useNotify";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { showErrorAlert } from "@/utils/alerts";
import { follow, subscribeIsFollowing, unfollow } from "../followRepository";

/**
 * Si la sesión actual sigue a `userId` (leyendo un solo doc, para listas largas) y `alternar`
 * para seguir o dejar de seguir. El cambio se ve al instante por la suscripción.
 */
export function useSigoA(userId: string) {
  const { uid } = useSessionUser();
  const [sigo, setSigo] = useState<boolean | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const notify = useNotify();

  useEffect(
    () =>
      subscribeIsFollowing(userId, uid, setSigo, (error) =>
        console.warn(
          "No se pudo saber si sigues a esta persona.",
          describeFirestoreError(error),
        ),
      ),
    [userId, uid],
  );

  const alternar = useCallback(async () => {
    if (pendiente || sigo === null || userId === uid) return;
    setPendiente(true);
    try {
      if (sigo) {
        await unfollow(userId, uid);
      } else {
        await follow(userId, uid);
        notify(userId, { type: "seguidor" });
      }
    } catch (error) {
      showErrorAlert(
        sigo ? "No se pudo dejar de seguir" : "No se pudo seguir",
        error,
      );
    } finally {
      setPendiente(false);
    }
  }, [pendiente, sigo, userId, uid, notify]);

  return { sigo, pendiente, alternar };
}
