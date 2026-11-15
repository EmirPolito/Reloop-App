import { useEffect, useState } from "react";

import type {
  DatosPerfil,
  PildoraPerfilData,
} from "@/features/perfil/Perfiltemas";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { completeOnboarding } from "@/features/perfil/profileRepository";
import {
  UsernameError,
  claimUsername,
} from "@/features/perfil/usernameRepository";
import { useIntroTerminada } from "@/features/intro/efecto-entrada";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import {
  borrarBorrador,
  leerBorrador,
  type BorradorOnboarding,
} from "./borradorOnboarding";
import {
  CIERRE_ONBOARDING_MS,
  DrawerOnboarding,
  ESPERA_APERTURA_ONBOARDING_MS,
} from "./DrawerOnboarding";
import { borrarPaso, guardarPaso, leerPaso } from "./progresoOnboarding";

/**
 * Configuración inicial de una cuenta nueva. Aparece la primera vez que la persona entra
 * con su cuenta ya verificada (la ficha nueva trae `onboardingPendiente`); las cuentas
 * anteriores nunca lo ven.
 *
 * Si ya la llenó al registrarse en este teléfono, lo elegido se sube solo y el drawer no
 * aparece. Si no (o si subirlo falla), se muestra el drawer, que guarda con la misma
 * lógica de Editar perfil, paso a paso, y recuerda en qué paso iba.
 */
export function SheetBienvenida() {
  const { profile, saveProfile } = useProfile();
  const { uid } = useSessionUser();
  const [paso, setPaso] = useState<number | null>(null);

  // `null` mientras se revisa si hay algo elegido al registrarse
  const [mostrarDrawer, setMostrarDrawer] = useState<boolean | null>(null);
  const [borrador, setBorrador] = useState<BorradorOnboarding | null>(null);

  useEffect(() => {
    if (!profile.onboardingPendiente) return;
    let vigente = true;
    Promise.all([leerPaso(uid), leerBorrador(uid)]).then(
      ([guardado, elegido]) => {
        if (!vigente) return;
        setPaso(guardado);
        if (elegido) setBorrador(elegido);
        else setMostrarDrawer(false);
      },
    );
    return () => {
      vigente = false;
    };
  }, [uid, profile.onboardingPendiente]);

  // El username automático se asigna justo después de crear la ficha: se espera a que
  // exista para poder cambiarlo por el elegido
  const listoParaSubir =
    borrador !== null && mostrarDrawer === null && profile.username !== null;
  useEffect(() => {
    if (!listoParaSubir || !borrador) return;
    let vigente = true;
    aplicarBorrador(uid, profile, saveProfile, borrador).then((aplicado) => {
      if (vigente && !aplicado) setMostrarDrawer(false);
    });
    return () => {
      vigente = false;
    };
    // Solo una vez, al estar lista la ficha: después el perfil cambia al subir el borrador
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listoParaSubir]);

  if (!profile.onboardingPendiente || paso === null || mostrarDrawer !== false)
    return null;
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

/**
 * Sube lo elegido al registrarse y termina la configuración. Devuelve `false` si no se
 * pudo (entonces se muestra el drawer para hacerlo ahí).
 */
async function aplicarBorrador(
  uid: string,
  profile: DatosPerfil,
  saveProfile: (data: DatosPerfil) => Promise<void>,
  borrador: BorradorOnboarding,
): Promise<boolean> {
  const { username, ...datos } = borrador;
  try {
    // Primero la ficha (con el username que ya tiene) y después el username elegido: así
    // guardar la ficha no pisa el cambio de username
    await saveProfile({ ...profile, ...datos });
  } catch (error) {
    console.warn("No se pudo subir la configuración del registro.", error);
    borrarBorrador(uid);
    return false;
  }

  if (username && username !== profile.username) {
    try {
      await claimUsername(uid, username);
    } catch (error) {
      if (error instanceof UsernameError) {
        showAlert(
          `@${username} ya no está disponible`,
          `Te asignamos @${profile.username}. Puedes cambiarlo en Editar perfil.`,
        );
      } else {
        console.warn("No se pudo asignar el usuario elegido.", error);
      }
    }
  }

  try {
    await completeOnboarding(uid);
    borrarBorrador(uid);
    borrarPaso(uid);
    return true;
  } catch (error) {
    console.warn("No se pudo terminar la configuración.", error);
    borrarBorrador(uid);
    return false;
  }
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

  const finalizar = async (pills: PildoraPerfilData[]) => {
    try {
      if (JSON.stringify(pills) !== JSON.stringify(profile.pills)) {
        await saveProfile({ ...profile, pills });
      }
    } catch (error) {
      showErrorAlert("No se pudo terminar la configuración", error);
      throw error;
    }
    // Primero baja el drawer; al terminar su animación se marca como completo (quitar la
    // marca desmonta el drawer, y hacerlo a media animación rompe el portal)
    setAbierto(false);
    await new Promise((listo) => setTimeout(listo, CIERRE_ONBOARDING_MS));
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
