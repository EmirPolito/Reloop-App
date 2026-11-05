import { createContext, type PropsWithChildren } from "react";

import type { SessionUser } from "@/features/auth/AuthProvider";
import { useRequiredContext } from "@/hooks/useRequiredContext";

const SessionUserContext = createContext<SessionUser | null>(null);

/** La persona con sesión iniciada, para todo lo que vive dentro de `(app)` (donde nunca es `null`). */
export function SessionUserProvider({
  user,
  children,
}: PropsWithChildren<{ user: SessionUser }>) {
  return (
    <SessionUserContext.Provider value={user}>
      {children}
    </SessionUserContext.Provider>
  );
}

export function useSessionUser(): SessionUser {
  return useRequiredContext(SessionUserContext, "SessionUserProvider");
}
