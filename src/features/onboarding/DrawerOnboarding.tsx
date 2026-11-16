import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import type { SessionUser } from "@/features/auth/AuthProvider";
import {
  SelectorAvatar,
  TITULOS_AVATAR,
  useFlujoAvatar,
} from "@/features/perfil/editar/SelectorAvatar";
import type { DatosPerfil } from "@/features/perfil/Perfiltemas";
import { SessionUserProvider } from "@/features/session/SessionUserProvider";
import {
  AppThemeContext,
  useAppTheme,
} from "@/features/shared/AppThemeProvider";
import { BotonPaso } from "./components/BotonPaso";
import {
  HojaOnboarding,
  type DireccionPaso,
} from "./components/HojaOnboarding";
import { PASOS_ONBOARDING, TITULOS_ONBOARDING } from "./onboardingRules";
import { ETIQUETAS_EJEMPLO, PasoEtiquetas } from "./pasos/PasoEtiquetas";
import { PasoFondo } from "./pasos/PasoFondo";
import { PasoUsuario } from "./pasos/PasoUsuario";
import { SUBIR_CARRUSEL } from "./temaOnboarding";

/** Lo que tarda en bajar el drawer al terminar (igual que en Editar perfil) */
export const CIERRE_ONBOARDING_MS = 450;
/** Margen para que el BottomSheet termine de montarse y medirse antes de abrirlo */
export const ESPERA_APERTURA_ONBOARDING_MS = 400;
/** Espera para que la página que se va conozca hacia dónde se desliza antes de cambiar de paso */
const ESPERA_DIRECCION_MS = 50;

/**
 * Alto del contenido del paso de avatar (carrusel, opciones y botón). Es el de las demás cards
 * mientras no se ha medido, por ejemplo al retomar la configuración en un paso posterior.
 */
const ALTO_BASE = 281;

const PASO_AVATAR = PASOS_ONBOARDING.indexOf("avatar");
const PASO_FONDO = PASOS_ONBOARDING.indexOf("fondo");
const PASO_ETIQUETAS = PASOS_ONBOARDING.indexOf("etiquetas");
const PASO_USUARIO = PASOS_ONBOARDING.indexOf("usuario");

/**
 * Configuración inicial en una sola card que no se puede cerrar hasta terminar; cada paso
 * entra deslizándose desde la derecha, como pasar una hoja:
 * 1. Avatar: el mismo selector de Editar perfil (orbes, Tomar / Elegir).
 * 2. Fondo: un carrusel de imágenes cuadradas, como el de avatares.
 * 3. Etiquetas: propio, del mismo alto que el de avatar.
 * 4. Usuario: el @usuario asignado, que se puede cambiar. Al terminar, quien lo usa lleva a
 *    la persona a su perfil.
 *
 * Solo dibuja: quien lo usa decide cómo se guarda cada cambio.
 */
export function DrawerOnboarding({
  visible,
  profile,
  paso,
  onPaso,
  onGuardar,
  onFinalizar,
  usuario,
}: {
  visible: boolean;
  profile: DatosPerfil;
  paso: number;
  onPaso: (paso: number) => void;
  /** Guarda cambios; si falla lanza (y ya avisó) */
  onGuardar: (cambios: Partial<DatosPerfil>) => Promise<void>;
  /** Termina la configuración; si falla lanza (y ya avisó) */
  onFinalizar: () => Promise<void>;
  /** Sesión para validar el @username en vivo (dentro de la app) */
  usuario?: SessionUser;
}) {
  const tema = useAppTheme();
  const { isDark } = tema;

  // La dirección se fija un instante antes de cambiar de paso: la página que sale se desliza
  // según lo último que dibujó
  const [direccion, setDireccion] = useState<DireccionPaso>("adelante");
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(espera.current), []);
  const ir = (destino: number) => {
    if (destino === paso || espera.current) return;
    setDireccion(destino > paso ? "adelante" : "atras");
    espera.current = setTimeout(() => {
      espera.current = undefined;
      onPaso(destino);
    }, ESPERA_DIRECCION_MS);
  };
  const siguiente = () => ir(paso + 1);

  // Todas las páginas miden al menos lo que el avatar
  const [altoMedido, setAltoMedido] = useState<number | undefined>();
  const altoAvatar = altoMedido ?? ALTO_BASE;

  const flujo = useFlujoAvatar({
    photo: profile.photo,
    orb: profile.orb,
    onGuardar,
    onListo: siguiente,
  });

  const conProveedores = (contenido: ReactNode) => (
    // El drawer se dibuja en un portal, fuera de los proveedores de la app: se vuelven a
    // dar aquí el tema (avatares) y, si hay, la sesión (validar el @username)
    <AppThemeContext.Provider value={tema}>
      {usuario ? (
        <SessionUserProvider user={usuario}>{contenido}</SessionUserProvider>
      ) : (
        contenido
      )}
    </AppThemeContext.Provider>
  );

  const enAvatar = paso === PASO_AVATAR;
  const titulo = enAvatar
    ? flujo.paso === "inicio"
      ? TITULOS_ONBOARDING.avatar
      : TITULOS_AVATAR[flujo.paso]
    : TITULOS_ONBOARDING[PASOS_ONBOARDING[paso]];

  return (
    <HojaOnboarding
      visible={visible}
      titulo={titulo}
      paso={paso}
      direccion={direccion}
      isDark={isDark}
      onBack={enAvatar ? flujo.volver : () => ir(paso - 1)}
      altoMinimo={altoAvatar}
      tituloNegrita={paso === PASO_ETIQUETAS || paso === PASO_USUARIO}
      permitirArrastrarContenido={!(enAvatar && flujo.paso === "ajustar")}
    >
      {conProveedores(
        enAvatar ? (
          <View
            onLayout={(e) => {
              if (flujo.paso === "inicio") {
                setAltoMedido(e.nativeEvent.layout.height);
              }
            }}
          >
            <SelectorAvatar
              flujo={flujo}
              photo={profile.photo}
              name={profile.name}
              isDark={isDark}
              claveCarrusel="onboarding"
              mostrarConfirmar={false}
              subirCarrusel={SUBIR_CARRUSEL}
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
        ) : (
          <View style={{ minHeight: altoAvatar }}>
            {paso === PASO_FONDO ? (
              <PasoFondo
                isDark={isDark}
                onGuardar={(cover) => onGuardar({ cover })}
                onContinuar={siguiente}
              />
            ) : paso === PASO_ETIQUETAS ? (
              <PasoEtiquetas
                inicial={
                  profile.pills.length > 0 ? profile.pills : ETIQUETAS_EJEMPLO
                }
                isDark={isDark}
                onContinuar={async (pills) => {
                  await onGuardar({ pills });
                  siguiente();
                }}
                onSaltar={siguiente}
              />
            ) : paso === PASO_USUARIO ? (
              <PasoUsuario
                username={profile.username}
                isDark={isDark}
                onFinalizar={onFinalizar}
              />
            ) : null}
          </View>
        ),
      )}
    </HojaOnboarding>
  );
}

const styles = StyleSheet.create({
  botonAvatar: { paddingHorizontal: 17, marginTop: 18 },
});
