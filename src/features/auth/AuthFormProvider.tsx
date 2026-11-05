import {
  createContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useRequiredContext } from "@/hooks/useRequiredContext";

interface AuthFormValue {
  email: string;
  onChangeEmail: (email: string) => void;
  password: string;
  onChangePassword: (password: string) => void;
}

const AuthFormContext = createContext<AuthFormValue | null>(null);

/** Correo y contraseña escritos: se conservan al pasar de acceso a registro o recuperación. */
export function AuthFormProvider({ children }: PropsWithChildren) {
  const [email, onChangeEmail] = useState("");
  const [password, onChangePassword] = useState("");
  const value = useMemo(
    () => ({ email, onChangeEmail, password, onChangePassword }),
    [email, password],
  );

  return (
    <AuthFormContext.Provider value={value}>{children}</AuthFormContext.Provider>
  );
}

export function useAuthForm(): AuthFormValue {
  return useRequiredContext(AuthFormContext, "AuthFormProvider");
}
