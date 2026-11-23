import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as DegradadoSvg,
  Path,
  Stop,
} from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { PressableScale } from "@/components/PressableScale";
import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/routes";
import {
  IconoChatLinea,
  IconoFavoritoLinea,
  IconoInicioLinea,
  IconoPerfil,
  IconoPerfilLinea,
} from "@/features/perfil/Perfiliconos";
import type { IconName } from "@/features/shared/constants";
import {
  ALTO_CAPSULA,
  MenuCrear,
  createStyles,
  type NavegacionProps,
} from "./Navegacion";

/**
 * Azul de la barra: brillante en dos tonos (en diagonal, más claro arriba a la izquierda), con
 * un reflejo arriba como el del botón de crear
 */
const AZUL_BARRA: [string, string] = ["#118ee7ff", "#118ee7ff"];
const AZUL_BARRA_OSCURO: [string, string] = ["#1F82D4", "#1060B4"];
/** Botón de crear: blanco con el mismo brillo en dos tonos y el "+" azul */
const CREAR_TONOS: [string, string] = ["#FFFFFF", "#DCEAFF"];
const COLOR_MAS = "#1260CF";
/** Iconos sobre el azul: el activo relleno y blanco; los inactivos de línea, en blanco suave */
const COLOR_ACTIVO = "#FFFFFF";
const COLOR_INACTIVO = "rgba(255, 255, 255, 0.85)";

/** Alto de la fila de iconos (sin la zona segura de abajo) */
const ALTO_FILA = 54;
/**
 * Las esquinas levantadas de arriba: la misma curva que la franja de la tarjeta grande (30),
 * hacia adentro, como si el contenido de encima tuviera las esquinas de abajo redondeadas y
 * se apoyara en la barra. Abajo llega recta hasta la orilla de la pantalla.
 */
const RADIO_SUPERIOR = 30;

/**
 * Fondo de la barra con su forma: borde de arriba recto y, en las orillas, se levanta en curva
 * hacia adentro. Degradado brillante en dos tonos con un reflejo en la parte de arriba.
 */
function FondoDock({
  ancho,
  alto,
  isDark,
}: {
  ancho: number;
  /** Alto de la barra sin las esquinas levantadas */
  alto: number;
  isDark: boolean;
}) {
  const r = RADIO_SUPERIOR;
  const total = alto + r;
  // Arranca arriba en la orilla izquierda, baja en curva hacia adentro hasta el borde recto,
  // lo cruza, sube en curva por la derecha y cierra por abajo
  const forma = [
    `M0 0`,
    `A${r} ${r} 0 0 0 ${r} ${r}`,
    `L${ancho - r} ${r}`,
    `A${r} ${r} 0 0 0 ${ancho} 0`,
    `L${ancho} ${total}`,
    `L0 ${total}`,
    "Z",
  ].join(" ");
  const [claro, intenso] = isDark ? AZUL_BARRA_OSCURO : AZUL_BARRA;
  return (
    <Svg
      pointerEvents="none"
      width={ancho}
      height={total}
      style={styles.fondoBarra}
    >
      <Defs>
        <DegradadoSvg id="dock-tonos" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={claro} />
          <Stop offset="1" stopColor={intenso} />
        </DegradadoSvg>
        <DegradadoSvg id="dock-reflejo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
        </DegradadoSvg>
      </Defs>
      <Path d={forma} fill="url(#dock-tonos)" />
      <Path d={forma} fill="url(#dock-reflejo)" />
    </Svg>
  );
}
const TAMANO_ICONO = 24;
/** Aire entre el borde de arriba y la fila: los botones quedan centrados en la barra */
const AIRE_ARRIBA = 8;
/** Píldora del botón central */
const ANCHO_CREAR = 66;
const ALTO_CREAR = 42;

const MENU_ABRIR = { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const MENU_CERRAR = { duration: 110, easing: Easing.out(Easing.cubic) };

interface Pestana {
  id: Tab;
  label: string;
  icon: IconName;
  /** Icono de línea para cuando no está activa */
  Linea: typeof IconoInicioLinea;
}

/** Dos pestañas a cada lado del botón de crear */
const IZQUIERDA: Pestana[] = [
  { id: "home", label: "Inicio", icon: "home", Linea: IconoInicioLinea },
  {
    id: "favorites",
    label: "Favoritos",
    icon: "favorite",
    Linea: IconoFavoritoLinea,
  },
];
const DERECHA: Pestana[] = [
  { id: "chats", label: "Chats", icon: "chat", Linea: IconoChatLinea },
  { id: "profile", label: "Perfil", icon: "person", Linea: IconoPerfilLinea },
];

/** Una pestaña: el icono relleno y blanco si está activa; de línea y en blanco suave si no */
const BotonPestana = memo(function BotonPestana({
  pestana,
  activa,
  conPunto,
  onPress,
}: {
  pestana: Pestana;
  activa: boolean;
  conPunto: boolean;
  onPress: (tab: Tab) => void;
}) {
  const { Linea } = pestana;
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={pestana.label}
      onPress={() => onPress(pestana.id)}
      scaleTo={0.9}
      hitSlop={6}
      style={styles.pestana}
    >
      <View style={styles.icono}>
        {!activa ? (
          <Linea size={TAMANO_ICONO} color={COLOR_INACTIVO} />
        ) : pestana.id === "profile" ? (
          <IconoPerfil size={TAMANO_ICONO} color={COLOR_ACTIVO} />
        ) : (
          <NavigationIcon
            name={pestana.icon}
            selected
            size={TAMANO_ICONO}
            color={COLOR_ACTIVO}
          />
        )}
        {conPunto ? <View style={styles.punto} /> : null}
      </View>
    </PressableScale>
  );
});

/**
 * Barra de navegación tipo dock: azul, pegada abajo de orilla a orilla (cubre la zona segura)
 * con las esquinas de arriba redondeadas. Dos pestañas a cada lado y, al centro, una píldora
 * de acento que abre el menú de crear (el mismo de la barra de cristal).
 * La barra anterior sigue en `Navegacion.tsx` por si se quiere volver a ella.
 */
function NavegacionDockBase({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const insets = useSafeAreaInsets();
  const { width: anchoPantalla } = useWindowDimensions();
  // Abajo, la zona segura un poco recortada: la barra no queda tan alta y la fila de iconos
  // no se pega a la rayita del iPhone
  const abajo = Platform.OS === "web" ? 12 : Math.max(insets.bottom - 20, 6);
  const altoBarra = ALTO_FILA + AIRE_ARRIBA + abajo;
  const estilosMenu = useMemo(() => createStyles(isDark), [isDark]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menu = useSharedValue(0);

  const abrirMenu = useCallback(() => {
    setMenuAbierto(true);
    setMenuVisible(true);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    menu.set(
      withTiming(0, MENU_CERRAR, (finished) => {
        if (finished) scheduleOnRN(setMenuVisible, false);
      }),
    );
  }, [menu]);

  useEffect(() => {
    if (!menuVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      cerrarMenu();
      return true;
    });
    return () => sub.remove();
  }, [menuVisible, cerrarMenu]);

  const irAPestana = useCallback(
    (tab: Tab) => {
      if (menuAbierto) cerrarMenu();
      if (tab !== activeTab) onNavigate(tab);
    },
    [activeTab, cerrarMenu, menuAbierto, onNavigate],
  );

  const crearPublicacion = useCallback(() => {
    cerrarMenu();
    requestAnimationFrame(() => onNavigate("create"));
  }, [cerrarMenu, onNavigate]);

  const pestana = (p: Pestana) => (
    <BotonPestana
      key={p.id}
      pestana={p}
      activa={activeTab === p.id}
      conPunto={p.id === "chats" && hasUnreadChats}
      onPress={irAPestana}
    />
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {menuVisible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={cerrarMenu}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <MenuCrear
        visible={menuVisible}
        menu={menu}
        isDark={isDark}
        // El menú se coloca a `bottom + ALTO_CAPSULA + 10`: queda 10 px sobre la barra
        bottom={altoBarra - ALTO_CAPSULA}
        onAnuncio={cerrarMenu}
        onPublicacion={crearPublicacion}
        styles={estilosMenu}
      />

      <View
        accessibilityRole="tablist"
        style={[
          styles.barra,
          { height: altoBarra, paddingTop: AIRE_ARRIBA, paddingBottom: abajo },
        ]}
      >
        <FondoDock ancho={anchoPantalla} alto={altoBarra} isDark={isDark} />
        {IZQUIERDA.map(pestana)}
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{
            selected: menuAbierto || activeTab === "create",
          }}
          accessibilityLabel="Publicar producto"
          onPress={menuAbierto ? cerrarMenu : abrirMenu}
          scaleTo={0.92}
          style={styles.crearSombra}
        >
          <LinearGradient
            colors={CREAR_TONOS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.crear}
          >
            {/* Reflejo: la mitad de arriba más clara, como cristal pulido */}
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0)"]}
              style={styles.reflejoCrear}
            />
            <NavigationIcon name="add" size={28} color={COLOR_MAS} />
          </LinearGradient>
        </PressableScale>
        {DERECHA.map(pestana)}
      </View>
    </View>
  );
}

export const NavegacionDock = memo(NavegacionDockBase);

const styles = StyleSheet.create({
  // Pegada abajo, de orilla a orilla; el fondo (con las esquinas levantadas) lo dibuja el SVG
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Los botones juntos al centro, con la misma separación entre ellos
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  // Sube por encima de la barra lo que miden las esquinas levantadas
  fondoBarra: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
  pestana: {
    width: 52,
    height: ALTO_FILA,
    alignItems: "center",
    justifyContent: "center",
  },
  icono: {
    width: TAMANO_ICONO,
    height: TAMANO_ICONO,
    alignItems: "center",
    justifyContent: "center",
  },
  // Punto de chats sin leer
  punto: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3366",
    borderWidth: 1.5,
    borderColor: AZUL_BARRA[0],
  },
  // Píldora central: resplandor de su color alrededor
  crearSombra: {
    borderRadius: ALTO_CREAR / 2,
    boxShadow: "0 4px 14px rgba(20, 70, 160, 0.3)",
  },
  crear: {
    width: ANCHO_CREAR,
    height: ALTO_CREAR,
    borderRadius: ALTO_CREAR / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    // Filo claro: se ve como una pieza pulida
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  reflejoCrear: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ALTO_CREAR / 2,
  },
});
