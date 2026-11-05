import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { useRequiredContext } from "@/hooks/useRequiredContext";
import { auth } from "@/lib/firebase";
import {
  cerrarSesion,
  comprobarVerificacion,
  enviarRecuperacion,
  iniciarSesion,
  registrarUsuario,
  reenviarVerificacion,
} from "./authService";

export interface SessionUser {
  uid: string;
  /** Nombre visible: displayName, o la parte local del correo, o "Usuario". */
  name: string;
  email: string | null;
}

/** `unverified`: tiene cuenta pero aún no abrió el enlace del correo de verificación. */
export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unverified"
  | "unauthenticated";

interface AuthSession {
  status: AuthStatus;
  user: SessionUser | null;
}

interface AuthContextValue extends AuthSession {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Vuelve a leer la cuenta; devuelve `true` si el correo ya está verificado (y entonces se abre la app). */
  checkVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: User | null): AuthSession {
  if (!user) return { status: "unauthenticated", user: null };
  return {
    status: user.emailVerified ? "authenticated" : "unverified",
    user: {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Usuario",
      email: user.email,
    },
  };
}

async function signIn(email: string, password: string): Promise<void> {
  await iniciarSesion(email, password);
}

/**
 * Mantiene la sesión de Firebase sincronizada con React.
 * Mientras se registra una cuenta se ignora el aviso intermedio de Firebase
 * (el usuario aparece antes de guardar su nombre) y la sesión se publica una
 * sola vez, ya completa.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>({
    status: "loading",
    user: null,
  });
  const isRegistering = useRef(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        if (isRegistering.current) return;
        setSession(toSession(firebaseUser));
      }),
    [],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      isRegistering.current = true;
      try {
        await registrarUsuario(name, email, password);
      } finally {
        isRegistering.current = false;
        setSession(toSession(auth.currentUser));
      }
    },
    [],
  );

  const checkVerification = useCallback(async () => {
    const verified = await comprobarVerificacion();
    // `reload` no dispara onAuthStateChanged: la sesión se publica a mano
    if (verified) setSession(toSession(auth.currentUser));
    return verified;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      signIn,
      signUp,
      signOut: cerrarSesion,
      sendPasswordReset: enviarRecuperacion,
      resendVerification: reenviarVerificacion,
      checkVerification,
    }),
    [session, signUp, checkVerification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useRequiredContext(AuthContext, "AuthProvider");
}
