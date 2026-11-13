import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import {
  DURACION_EDITAR,
  EASE_EDITAR,
  INTER,
  coloresEditar,
} from "@/features/perfil/editar/editarTema";
import {
  SelectorAvatar,
  TITULOS_AVATAR,
  useFlujoAvatar,
} from "@/features/perfil/editar/SelectorAvatar";
import { SheetEditar } from "@/features/perfil/editar/SheetEditar";
import type {
  DatosPerfil,
  PildoraPerfilData,
} from "@/features/perfil/Perfiltemas";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { completeOnboarding } from "@/features/perfil/profileRepository";
import { useIntroTerminada } from "@/features/intro/efecto-entrada";
import {
  SessionUserProvider,
  useSessionUser,
} from "@/features/session/SessionUserProvider";
import {
  AppThemeContext,
  useAppTheme,
} from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import { BotonPaso } from "./components/BotonPaso";
import { PASOS_ONBOARDING, TITULOS_ONBOARDING } from "./onboardingRules";
import { PasoIdentidad } from "./pasos/PasoIdentidad";
import { PasoPortada } from "./pasos/PasoPortada";
import { borrarPaso, guardarPaso, leerPaso } from "./progresoOnboarding";

/** Margen para que el BottomSheet termine de montarse y medirse antes de abrirlo */
const ESPERA_APERTURA_MS = 400;
/** Lo que tarda en bajar el drawer (igual que en Editar perfil) */
const CIERRE_MS = 450;

/**
 * Configuración inicial de una cuenta nueva: portada, avatar e identidad en un drawer que
 * no se puede cerrar hasta terminar. Aparece la primera vez que la persona entra con su
 * cuenta ya creada y verificada (la ficha nueva trae `onboardingPendiente`); las cuentas
 * anteriores nunca lo ven. Guarda con la misma lógica de Editar perfil, paso a paso, y
 * recuerda en qué paso iba.
 */
export function SheetBienvenida() {
  const { profile } = useProfile();
  const { uid } = useSessionUser();
  const { isDark } = useAppTheme();
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
      isDark={isDark}
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
  isDark,
  paso,
  onPaso,
}: {
  profile: DatosPerfil;
  uid: string;
  isDark: boolean;
  paso: number;
  onPaso: (paso: number) => void;
}) {
  const { saveProfile } = useProfile();
  const tema = useAppTheme();
  const usuario = useSessionUser();
  const c = coloresEditar(isDark);
  // Nace cerrado y se abre cuando la animación de entrada ya terminó, con un margen para
  // que el BottomSheet se mida: solo se presenta al pasar de cerrado a abierto, y si eso
  // ocurre mientras la animación lo tapa se queda fuera de la pantalla
  const introTerminada = useIntroTerminada();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!introTerminada) return;
    const espera = setTimeout(() => setAbierto(true), ESPERA_APERTURA_MS);
    return () => clearTimeout(espera);
  }, [introTerminada]);
  const nombrePaso = PASOS_ONBOARDING[paso];

  /** Igual que en Editar perfil: si falla se avisa y se relanza */
  const guardar = async (cambios: Partial<DatosPerfil>) => {
    try {
      await saveProfile({ ...profile, ...cambios });
    } catch (error) {
      showErrorAlert("No se pudieron guardar los cambios", error);
      throw error;
    }
  };

  const siguiente = () =>
    onPaso(Math.min(paso + 1, PASOS_ONBOARDING.length - 1));

  const flujo = useFlujoAvatar({
    photo: profile.photo,
    orb: profile.orb,
    onGuardar: guardar,
    onListo: siguiente,
  });

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
    await new Promise((listo) => setTimeout(listo, CIERRE_MS));
    try {
      await completeOnboarding(uid);
      borrarPaso(uid);
    } catch (error) {
      setAbierto(true);
      showErrorAlert("No se pudo terminar la configuración", error);
      throw error;
    }
  };

  const enSubpasoAvatar = nombrePaso === "avatar" && flujo.paso !== "inicio";
  const titulo = enSubpasoAvatar
    ? TITULOS_AVATAR[flujo.paso]
    : TITULOS_ONBOARDING[nombrePaso];
  const volver = enSubpasoAvatar
    ? flujo.volver
    : paso > 0
      ? () => onPaso(paso - 1)
      : undefined;

  return (
    <SheetEditar
      visible={abierto}
      titulo={titulo}
      isDark={isDark}
      onClose={() => {}}
      onBack={volver}
      bloqueado
      permitirArrastrarContenido={flujo.paso !== "ajustar"}
    >
      {/* El drawer se dibuja en un portal, fuera de los proveedores de la app: se vuelven a
          dar aquí el tema (avatares) y la sesión (validar el @username) */}
      <AppThemeContext.Provider value={tema}>
        <SessionUserProvider user={usuario}>
          <Progreso paso={paso} isDark={isDark} />

          <Animated.View
            key={nombrePaso}
            entering={FadeIn.duration(DURACION_EDITAR)}
            exiting={FadeOut.duration(120)}
          >
            {nombrePaso === "portada" ? (
              <PasoPortada
                cover={profile.cover}
                color={profile.color}
                isDark={isDark}
                onGuardar={(cover) => guardar({ cover })}
                onSiguiente={siguiente}
              />
            ) : null}

            {nombrePaso === "avatar" ? (
              <View style={styles.avatar}>
                <SelectorAvatar
                  flujo={flujo}
                  photo={profile.photo}
                  name={profile.name}
                  isDark={isDark}
                  claveCarrusel="onboarding"
                  mostrarConfirmar={false}
                />
                {flujo.paso === "inicio" ? (
                  <View style={styles.botonAvatar}>
                    <BotonPaso
                      texto={flujo.hayCambio ? "Usar este avatar" : "Continuar"}
                      isDark={isDark}
                      cargando={flujo.guardando}
                      onPress={() =>
                        flujo.hayCambio ? void flujo.usarAvatar() : siguiente()
                      }
                    />
                  </View>
                ) : null}
              </View>
            ) : null}

            {nombrePaso === "identidad" ? (
              <PasoIdentidad
                profile={profile}
                isDark={isDark}
                onGuardar={guardar}
                onFinalizar={finalizar}
              />
            ) : null}
          </Animated.View>

          <Text
            style={[INTER.regular, styles.pie, { color: c.suave }]}
            accessibilityLiveRegion="polite"
          >
            Paso {paso + 1} de {PASOS_ONBOARDING.length} · Puedes cambiar todo
            luego en Editar perfil
          </Text>
        </SessionUserProvider>
      </AppThemeContext.Provider>
    </SheetEditar>
  );
}

/** Barra de progreso: se llena con suavidad al avanzar o regresar */
function Progreso({ paso, isDark }: { paso: number; isDark: boolean }) {
  const c = coloresEditar(isDark);
  const total = PASOS_ONBOARDING.length;
  const relleno = useAnimatedStyle(() => ({
    width: withTiming(`${((paso + 1) / total) * 100}%`, {
      duration: 320,
      easing: EASE_EDITAR,
    }),
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${paso + 1} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: paso + 1 }}
      style={[styles.pista, { backgroundColor: c.divisor }]}
    >
      <Animated.View
        style={[styles.relleno, { backgroundColor: c.texto }, relleno]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pista: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 17,
    marginBottom: 16,
    overflow: "hidden",
  },
  relleno: { height: 4, borderRadius: 2 },
  avatar: { gap: 0 },
  botonAvatar: { paddingHorizontal: 17, marginTop: 18 },
  pie: { fontSize: 12, textAlign: "center", marginTop: 14 },
});
