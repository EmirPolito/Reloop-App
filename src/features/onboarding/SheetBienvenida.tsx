import { useEffect, useState } from "react";

import type { DatosPerfil } from "@/features/perfil/temasPerfil";
import { useProfile } from "@/features/perfil/ProveedorPerfil";
import { completeOnboarding } from "@/features/perfil/repositorioPerfil";
import { useIntroTerminada } from "@/features/intro/efecto-entrada";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { showErrorAlert } from "@/utils/alerts";
import {
  CIERRE_ONBOARDING_MS,
  DrawerOnboarding,
  ESPERA_APERTURA_ONBOARDING_MS,
} from "./DrawerOnboarding";
import { borrarPaso, guardarPaso, leerPaso } from "./progresoOnboarding";

/**
 * Configuración inicial de una cuenta nueva: aparece la primera vez que la persona entra
 * ya con el correo verificado (la ficha nueva trae `onboardingPendiente`); las cuentas
 * anteriores nunca la ven. Guarda con la misma lógica de Editar perfil, paso a paso, y
 * recuerda en qué paso iba. Al terminar lleva a la persona a su perfil.
 */
export function SheetBienvenida() {
  const { profile } = useProfile();
  const { uid } = useSessionUser();
  const [paso, setPaso] = useState<number | null>(null);

  useEffect(() => {
    if (!profile.onboardingPendiente) return;
    let vigente = true;
    leerPaso(uid).then((guardado) => {
      if (vigente) setPaso(guardado);
    });
    return () => {
      vigente = false;
    };
  }, [uid, profile.onboardingPendiente]);

  if (!profile.onboardingPendiente || paso === null) return null;
  return (
    <Contenido
      profile={profile}
      uid={uid}
      paso={paso}
      onPaso={(siguiente) => {
        setPaso(siguiente);
        guardarPaso(uid, siguiente);
      }}
    />
  );
}

function Contenido({
  profile,
  uid,
  paso,
  onPaso,
}: {
  profile: DatosPerfil;
  uid: string;
  paso: number;
  onPaso: (paso: number) => void;
}) {
  const { saveProfile } = useProfile();
  const { navigate } = useNavegacion();
  const usuario = useSessionUser();
  // Nace cerrado y se abre cuando la animación de entrada ya terminó, con un margen para
  // que el BottomSheet se mida: solo se presenta al pasar de cerrado a abierto, y si eso
  // ocurre mientras la animación lo tapa se queda fuera de la pantalla
  const introTerminada = useIntroTerminada();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!introTerminada) return;
    const espera = setTimeout(
      () => setAbierto(true),
      ESPERA_APERTURA_ONBOARDING_MS,
    );
    return () => clearTimeout(espera);
  }, [introTerminada]);

  /** Igual que en Editar perfil: si falla se avisa y se relanza */
  const guardar = async (cambios: Partial<DatosPerfil>) => {
    try {
      await saveProfile({ ...profile, ...cambios });
    } catch (error) {
      showErrorAlert("No se pudieron guardar los cambios", error);
      throw error;
    }
  };

  const finalizar = async () => {
    // Primero baja el drawer; al terminar su animación se lleva a la persona a su perfil y se
    // marca la configuración como completa (quitar la marca desmonta el drawer, y hacerlo a
    // media animación rompe el portal)
    setAbierto(false);
    await new Promise((listo) => setTimeout(listo, CIERRE_ONBOARDING_MS));
    navigate("profile");
    try {
      await completeOnboarding(uid);
      borrarPaso(uid);
    } catch (error) {
      setAbierto(true);
      showErrorAlert("No se pudo terminar la configuración", error);
      throw error;
    }
  };

  return (
    <DrawerOnboarding
      visible={abierto}
      profile={profile}
      paso={paso}
      onPaso={onPaso}
      onGuardar={guardar}
      onFinalizar={finalizar}
      usuario={usuario}
    />
  );
}
