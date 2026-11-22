import { useEffect, useState } from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { subscribeFollowing } from "../followRepository";

/** A quiénes sigue la sesión actual, en tiempo real (el seguido más reciente primero). */
export function useSiguiendo(): string[] {
  const { uid } = useSessionUser();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(
    () =>
      subscribeFollowing(uid, setIds, (error) =>
        console.warn(
          "No se pudo leer a quién sigues.",
          describeFirestoreError(error),
        ),
      ),
    [uid],
  );

  return ids;
}
