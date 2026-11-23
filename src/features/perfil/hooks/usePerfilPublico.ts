import { useEffect, useState } from "react";

import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import type { DatosPerfil } from "../temasPerfil";
import { useProfile } from "../ProveedorPerfil";
import { subscribeProfile } from "../repositorioPerfil";

interface Loaded {
  userId: string;
  /** `null`: la persona no tiene ficha de perfil. */
  profile: DatosPerfil | null;
  status: FeedStatus;
}

/**
 * Perfil de cualquier persona en tiempo real. El propio sale de `ProfileProvider`, sin
 * una segunda suscripción.
 */
export function usePerfilPublico(userId: string): {
  profile: DatosPerfil | null;
  status: FeedStatus;
} {
  const { uid } = useSessionUser();
  const { profile: ownProfile } = useProfile();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const isOwn = userId === uid;

  useEffect(() => {
    if (isOwn) return;
    return subscribeProfile(
      userId,
      (profile) => setLoaded({ userId, profile, status: "ready" }),
      (error) => {
        console.warn(
          "No se pudo leer el perfil.",
          describeFirestoreError(error),
        );
        setLoaded({ userId, profile: null, status: "error" });
      },
    );
  }, [userId, isOwn]);

  if (isOwn) return { profile: ownProfile, status: "ready" };
  // Si la persona cambia, lo guardado es de la anterior y se ignora hasta que llegue lo nuevo
  const current = loaded?.userId === userId ? loaded : null;
  return {
    profile: current?.profile ?? null,
    status: current?.status ?? "loading",
  };
}
