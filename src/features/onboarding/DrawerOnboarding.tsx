import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import type { SessionUser } from "@/features/auth/AuthProvider";
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
import { SessionUserProvider } from "@/features/session/SessionUserProvider";
import {
  AppThemeContext,
  useAppTheme,
} from "@/features/shared/AppThemeProvider";
import { BotonPaso } from "./components/BotonPaso";
import { HojaOnboarding } from "./components/HojaOnboarding";
import { PASOS_ONBOARDING, TITULOS_ONBOARDING } from "./onboardingRules";
import { ETIQUETAS_EJEMPLO, PasoEtiquetas } from "./pasos/PasoEtiquetas";
import { PasoPerfil } from "./pasos/PasoPerfil";

/** Lo que tarda en bajar un drawer (igual que en Editar perfil) */
export const CIERRE_ONBOARDING_MS = 450;
/** Margen para que el BottomSheet termine de montarse y medirse antes de abrirlo */
export const ESPERA_APERTURA_ONBOARDING_MS = 400;

const PASO_AVATAR = PASOS_ONBOARDING.indexOf("avatar");
const PASO_ETIQUETAS = PASOS_ONBOARDING.indexOf("etiquetas");
const PASO_PERFIL = PASOS_ONBOARDING.indexOf("perfil");

/**
 * Configuración inicial en tres drawers, uno tras otro (el actual baja y sube el
 * siguiente), que no se pueden cerrar hasta terminar:
 * 1. Avatar: el mismo selector de Editar perfil (orbes, Tomar / Elegir).
 * 2. Etiquetas: propio, del mismo alto que el de avatar.
 * 3. Perfil: todo organizado, con lápices para editar y una card con el fondo, el avatar
 *    y las etiquetas (que vuelven a abrir su drawer y regresan aquí).
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
  /** Termina la configuración con las etiquetas guardadas; si falla lanza (y ya avisó) */
  onFinalizar: (pills: PildoraPerfilData[]) => Promise<void>;
  /** Sesión para validar el @username en vivo (dentro de la app) */
  usuario?: SessionUser;
}) {
  const tema = useAppTheme();
  const { isDark } = tema;
  const etapa = PASOS_ONBOARDING[paso];

  // Entre un drawer y otro: el actual baja por completo antes de subir el siguiente
  const [cambiando, setCambiando] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(espera.current), []);
  const ir = (destino: number) => {
    if (destino === paso) return;
    setCambiando(true);
    espera.current = setTimeout(() => {
      onPaso(destino);
      setCambiando(false);
    }, CIERRE_ONBOARDING_MS);
  };

  // Después de llegar al perfil, avatar y etiquetas regresan ahí en vez de seguir el orden
  const [desdePerfil, setDesdePerfil] = useState(etapa === "perfil");
  const tras = (siguiente: number) => (desdePerfil ? PASO_PERFIL : siguiente);

  // El drawer de etiquetas mide lo mismo que el de avatar
  const [altoAvatar, setAltoAvatar] = useState<number | undefined>();

  const flujo = useFlujoAvatar({
    photo: profile.photo,
    orb: profile.orb,
    onGuardar,
    onListo: () => ir(tras(PASO_ETIQUETAS)),
  });

  const abierto = (cual: number) => visible && !cambiando && paso === cual;

  const conProveedores = (contenido: ReactNode) => (
    // Los drawers se dibujan en un portal, fuera de los proveedores de la app: se vuelven a
    // dar aquí el tema (avatares) y, si hay, la sesión (validar el @username)
    <AppThemeContext.Provider value={tema}>
      {usuario ? (
        <SessionUserProvider user={usuario}>{contenido}</SessionUserProvider>
      ) : (
        contenido
      )}
    </AppThemeContext.Provider>
  );

  return (
    <>
      {/* 1 · Avatar: el selector de siempre */}
      <SheetEditar
        visible={abierto(PASO_AVATAR)}
        titulo={
          flujo.paso === "inicio"
            ? TITULOS_ONBOARDING.avatar
            : TITULOS_AVATAR[flujo.paso]
        }
        isDark={isDark}
        onClose={() => {}}
        onBack={
          flujo.volver ?? (desdePerfil ? () => ir(PASO_PERFIL) : undefined)
        }
        bloqueado
        permitirArrastrarContenido={flujo.paso !== "ajustar"}
      >
        {conProveedores(
          <View
            onLayout={(e) => {
              if (flujo.paso === "inicio") {
                setAltoAvatar(e.nativeEvent.layout.height);
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
            />
            {flujo.paso === "inicio" ? (
              <View style={styles.botonAvatar}>
                <BotonPaso
                  texto={flujo.hayCambio ? "Usar este avatar" : "Continuar"}
                  isDark={isDark}
                  cargando={flujo.guardando}
                  onPress={() =>
                    flujo.hayCambio
                      ? void flujo.usarAvatar()
                      : ir(tras(PASO_ETIQUETAS))
                  }
                />
              </View>
            ) : null}
          </View>,
        )}
      </SheetEditar>

      {/* 2 · Etiquetas */}
      <HojaOnboarding
        visible={abierto(PASO_ETIQUETAS)}
        titulo={TITULOS_ONBOARDING.etiquetas}
        isDark={isDark}
        onBack={() => ir(desdePerfil ? PASO_PERFIL : PASO_AVATAR)}
        altoMinimo={altoAvatar}
      >
        {conProveedores(
          // Se monta de nuevo cada vez que se abre: parte de las etiquetas guardadas
          etapa === "etiquetas" ? (
            <PasoEtiquetas
              inicial={
                profile.pills.length > 0 ? profile.pills : ETIQUETAS_EJEMPLO
              }
              isDark={isDark}
              onContinuar={async (pills) => {
                await onGuardar({ pills });
                setDesdePerfil(true);
                ir(PASO_PERFIL);
              }}
              onSaltar={() => {
                setDesdePerfil(true);
                ir(PASO_PERFIL);
              }}
            />
          ) : null,
        )}
      </HojaOnboarding>

      {/* 3 · Perfil organizado */}
      <HojaOnboarding
        visible={abierto(PASO_PERFIL)}
        titulo={TITULOS_ONBOARDING.perfil}
        isDark={isDark}
      >
        {conProveedores(
          <PasoPerfil
            profile={profile}
            isDark={isDark}
            onGuardar={onGuardar}
            onFinalizar={() => onFinalizar(profile.pills)}
            onAvatar={() => {
              setDesdePerfil(true);
              flujo.reiniciar();
              ir(PASO_AVATAR);
            }}
            onEtiquetas={() => {
              setDesdePerfil(true);
              ir(PASO_ETIQUETAS);
            }}
          />,
        )}
      </HojaOnboarding>
    </>
  );
}

const styles = StyleSheet.create({
  botonAvatar: { paddingHorizontal: 17, marginTop: 18 },
});
