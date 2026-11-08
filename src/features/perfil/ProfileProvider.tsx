import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { ensureAccountEmail } from "./accountRepository";
import type { DatosPerfil } from "./Perfiltemas";
import { defaultProfile } from "./profileMappers";
import { ensureProfile, subscribeProfile } from "./profileRepository";
import { saveOwnProfile } from "./saveOwnProfile";

interface ProfileValue {
  profile: DatosPerfil;
  /** Guarda el perfil; si falla lanza el error para que quien llama lo muestre. */
  saveProfile: (data: DatosPerfil) => Promise<void>;
}

const ProfileContext = createContext<ProfileValue | null>(null);

/**
 * Perfil propio, guardado en Firestore y sincronizado en tiempo real. Mientras llega
 * (o si la ficha aún no existe) se muestra uno por defecto con el nombre de la cuenta.
 */
export function ProfileProvider({ children }: PropsWithChildren) {
  const user = useSessionUser();
  const { setThemeColor } = useAppTheme();
  const [stored, setStored] = useState<DatosPerfil | null>(null);

  useEffect(() => {
    // Cuentas creadas antes de existir las fichas: se completan al iniciar sesión
    ensureProfile(user.uid, user.name).catch((error) =>
      console.warn("No se pudo preparar el perfil.", describeFirestoreError(error)),
    );
    ensureAccountEmail(user.uid, user.email).catch((error) =>
      console.warn("No se pudo guardar el correo.", describeFirestoreError(error)),
    );
    return subscribeProfile(
      user.uid,
      (profile) => {
        if (profile) {
          setStored(profile);
          setThemeColor(profile.color);
        }
      },
      (error) =>
        console.warn("No se pudo leer el perfil.", describeFirestoreError(error)),
      user.name,
    );
  }, [user.uid, user.name, user.email, setThemeColor]);

  const profile = useMemo(
    () => stored ?? defaultProfile(user.name),
    [stored, user.name],
  );

  const saveProfile = useCallback(
    (data: DatosPerfil) => saveOwnProfile(user.uid, profile, data),
    [user.uid, profile],
  );

  const value = useMemo(() => ({ profile, saveProfile }), [profile, saveProfile]);

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileValue {
  return useRequiredContext(ProfileContext, "ProfileProvider");
}
