import { useCallback, useEffect, useState } from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { showErrorAlert } from "@/utils/alerts";
import { follow, subscribeFollowers, unfollow } from "../followRepository";

interface Loaded {
  userId: string;
  followerIds: string[];
}

/**
 * Seguidores de una persona en tiempo real y si la sesión actual la sigue.
 * `toggleFollow` sigue o deja de seguir; el cambio se ve al instante por la suscripción.
 */
export function useFollowers(userId: string) {
  const { uid } = useSessionUser();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(
    () =>
      subscribeFollowers(
        userId,
        (followerIds) => setLoaded({ userId, followerIds }),
        (error) =>
          console.warn(
            "No se pudieron leer los seguidores.",
            describeFirestoreError(error),
          ),
      ),
    [userId],
  );

  // Si la persona cambia, lo guardado es de la anterior y se ignora
  const followerIds = loaded?.userId === userId ? loaded.followerIds : [];
  const isFollowing = followerIds.includes(uid);

  const toggleFollow = useCallback(async () => {
    if (pending || userId === uid) return;
    setPending(true);
    try {
      await (isFollowing ? unfollow(userId, uid) : follow(userId, uid));
    } catch (error) {
      showErrorAlert(
        isFollowing ? "No se pudo dejar de seguir" : "No se pudo seguir",
        error,
      );
    } finally {
      setPending(false);
    }
  }, [pending, userId, uid, isFollowing]);

  return {
    followersCount: followerIds.length,
    isFollowing,
    pending,
    toggleFollow,
  };
}
