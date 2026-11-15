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
  "loading" | "authenticated" | "unverified" | "unauthenticated";

interface AuthSession {
  status: AuthStatus;
  user: SessionUser | null;
}

interface AuthContextValue extends AuthSession {
  signIn: (email: string, password: string) => Promise<void>;
  /**
   * Crea la cuenta sin publicar la sesión (la pantalla de registro sigue visible para la
   * configuración inicial) y devuelve su uid. Hay que llamar a `finishSignUp` después.
   */
  signUp: (name: string, email: string, password: string) => Promise<string>;
  /** Publica la sesión de la cuenta recién creada (y con eso se pasa a verificar el correo). */
  finishSignUp: () => void;
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
 * Mientras se registra una cuenta se ignoran los avisos de Firebase (el usuario aparece
 * antes de guardar su nombre, y después sigue la configuración inicial en la pantalla de
 * registro): la sesión se publica una sola vez, con `finishSignUp`.
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
        const user = await registrarUsuario(name, email, password);
        return user.uid;
      } catch (error) {
        // Sin cuenta creada no hay nada que esperar: se vuelve a escuchar a Firebase
        isRegistering.current = false;
        setSession(toSession(auth.currentUser));
        throw error;
      }
    },
    [],
  );

  const finishSignUp = useCallback(() => {
    if (!isRegistering.current) return;
    isRegistering.current = false;
    setSession(toSession(auth.currentUser));
  }, []);

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
      finishSignUp,
      signOut: cerrarSesion,
      sendPasswordReset: enviarRecuperacion,
      resendVerification: reenviarVerificacion,
      checkVerification,
    }),
    [session, signUp, finishSignUp, checkVerification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useRequiredContext(AuthContext, "AuthProvider");
}
