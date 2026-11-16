import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/routes";
import {
  IconoAnuncios,
  IconoChatLinea,
  IconoFavoritoLinea,
  IconoInicioLinea,
  IconoPerfil,
  IconoPerfilLinea,
  IconoPublicaciones,
} from "@/features/perfil/Perfiliconos";
import { Text } from "@/features/shared/Text";
import type { IconName } from "@/features/shared/constants";
import { BlurView } from "expo-blur";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export interface NavegacionProps {
  /** `null` en pantallas fuera de las pestañas: ningún icono queda marcado */
  activeTab: Tab | null;
  onNavigate: (tab: Tab) => void;
  isDark?: boolean;
  hasUnreadChats?: boolean;
  /** Props opcionales por compatibilidad si algún layout aún las pasa */
  onOpenNotifications?: () => void;
  notificacionesActivas?: boolean;
  unreadNotifications?: number;
}

interface NavTabItem {
  id: Tab;
  label: string;
  icon: IconName;
}

const NAV_TABS: NavTabItem[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "favorites", label: "Favoritos", icon: "favorite" },
  { id: "chats", label: "Chats", icon: "chat" },
  { id: "profile", label: "Perfil", icon: "person" },
];

/** 4 pestañas + 1 botón de crear = 5 módulos en un solo fondo */
const INDICE_CREAR = NAV_TABS.length;
const TOTAL_BOTONES = NAV_TABS.length + 1;
const MAX_INDEX = TOTAL_BOTONES - 1;

const ALTO_CAPSULA = 66;
const MARGEN_CAPSULA = 5;
const TAMANO_ICONO = 21;

const ICONOS_LINEA: Partial<
  Record<Tab, ComponentType<{ size?: number; color?: string }>>
> = {
  home: IconoInicioLinea,
  favorites: IconoFavoritoLinea,
  chats: IconoChatLinea,
  profile: IconoPerfilLinea,
};

/* -------------------------------------------------------------------------- */
/*  Animaciones Liquid Glass (curva fluida estilo Apple en hilo de UI)        */
/* -------------------------------------------------------------------------- */

/** Arranca rápido y frena con suavidad sedosa, sin rebote excesivo */
const SPRING_PILDORA = { damping: 26, stiffness: 185, mass: 0.92 };
const APARECER = { duration: 180, easing: Easing.out(Easing.cubic) };

const MENU_ABRIR = { duration: 240, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const MENU_CERRAR = { duration: 160, easing: Easing.out(Easing.cubic) };

const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

type Estilos = ReturnType<typeof createStyles>;

/**
 * Superficie Liquid Glass: desenfoque nativo (iOS/Web), tinte translúcido
 * y reflejo especular superior para simular refracción de borde curvo.
 */
const LiquidGlassSurface = memo(function LiquidGlassSurface({
  isDark,
  styles,
}: {
  isDark: boolean;
  styles: Estilos;
}) {
  return (
    <>
      {Platform.OS !== "android" && (
        <BlurView
          intensity={55}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.cristalTinte]}
      />
      <View pointerEvents="none" style={styles.reflejoSuperior} />
    </>
  );
});

/**
 * Pestaña de la cápsula con icono y etiqueta del módulo debajo.
 */
const TabButton = memo(function TabButton({
  tab,
  indice,
  selected,
  posicion,
  indicadorVisible,
  showBadge,
  isDark,
  onPress,
  styles,
}: {
  tab: NavTabItem;
  indice: number;
  selected: boolean;
  posicion: SharedValue<number>;
  indicadorVisible: SharedValue<number>;
  showBadge: boolean;
  isDark: boolean;
  onPress: (tab: Tab) => void;
  styles: Estilos;
}) {
  const activeStyle = useAnimatedStyle(() => {
    const activo =
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
      indicadorVisible.get();
    return { opacity: activo };
  });

  const inactiveStyle = useAnimatedStyle(() => {
    const activo =
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
      indicadorVisible.get();
    return { opacity: 1 - activo };
  });

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  const colorActivo = "#101010";
  const IconoLinea = ICONOS_LINEA[tab.id];

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.label}
      onPress={() => onPress(tab.id)}
      scaleTo={0.92}
      style={styles.hueco}
    >
      <View style={styles.icono}>
        <Animated.View style={[styles.iconoCapa, inactiveStyle]}>
          {IconoLinea ? (
            <IconoLinea size={TAMANO_ICONO} color={colorInactivo} />
          ) : (
            <NavigationIcon
              name={tab.icon}
              selected={false}
              size={TAMANO_ICONO}
              color={colorInactivo}
            />
          )}
        </Animated.View>
        <Animated.View style={[styles.iconoCapa, activeStyle]}>
          {tab.id === "profile" ? (
            <IconoPerfil size={TAMANO_ICONO} color={colorActivo} />
          ) : (
            <NavigationIcon
              name={tab.icon}
              selected
              size={TAMANO_ICONO}
              color={colorActivo}
            />
          )}
        </Animated.View>
        {showBadge ? <View style={styles.punto} /> : null}
      </View>

      <View style={styles.etiquetaContenedor}>
        <Animated.Text
          numberOfLines={1}
          style={[styles.etiqueta, { color: colorInactivo }, inactiveStyle]}
        >
          {tab.label}
        </Animated.Text>
        <Animated.Text
          numberOfLines={1}
          style={[styles.etiqueta, { color: colorActivo }, activeStyle]}
        >
          {tab.label}
        </Animated.Text>
      </View>
    </PressableScale>
  );
});

/** Botón de crear integrado como 5to módulo con reacción en vivo al pasar la píldora */
const CreateSlotButton = memo(function CreateSlotButton({
  selected,
  posicion,
  indicadorVisible,
  onPress,
  isDark,
  styles,
}: {
  selected: boolean;
  posicion: SharedValue<number>;
  indicadorVisible: SharedValue<number>;
  onPress: () => void;
  isDark: boolean;
  styles: Estilos;
}) {
  const activeStyle = useAnimatedStyle(() => {
    const activo =
      Math.max(0, 1 - Math.abs(posicion.get() - INDICE_CREAR)) *
      indicadorVisible.get();
    return { opacity: activo };
  });

  const inactiveStyle = useAnimatedStyle(() => {
    const activo =
      Math.max(0, 1 - Math.abs(posicion.get() - INDICE_CREAR)) *
      indicadorVisible.get();
    return { opacity: 1 - activo };
  });

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  const colorActivo = "#101010";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel="Publicar producto"
      onPress={onPress}
      scaleTo={0.92}
      style={styles.hueco}
    >
      <View style={styles.icono}>
        <Animated.View style={[styles.iconoCapa, inactiveStyle]}>
          <NavigationIcon
            name="add"
            size={TAMANO_ICONO + 2}
            color={colorInactivo}
          />
        </Animated.View>
        <Animated.View style={[styles.iconoCapa, activeStyle]}>
          <NavigationIcon
            name="add"
            size={TAMANO_ICONO + 2}
            color={colorActivo}
          />
        </Animated.View>
      </View>

      <View style={styles.etiquetaContenedor}>
        <Animated.Text
          numberOfLines={1}
          style={[styles.etiqueta, { color: colorInactivo }, inactiveStyle]}
        >
          Crear
        </Animated.Text>
        <Animated.Text
          numberOfLines={1}
          style={[styles.etiqueta, { color: colorActivo }, activeStyle]}
        >
          Crear
        </Animated.Text>
      </View>
    </PressableScale>
  );
});

/** Menú flotante Liquid Glass sin desenfocar el resto de la pantalla */
function MenuCrear({
  visible,
  menu,
  isDark,
  bottom,
  onAnuncio,
  onPublicacion,
  styles,
}: {
  visible: boolean;
  menu: SharedValue<number>;
  isDark: boolean;
  bottom: number;
  onAnuncio: () => void;
  onPublicacion: () => void;
  styles: Estilos;
}) {
  const opcionesStyle = useAnimatedStyle(() => ({
    opacity: menu.value,
    transform: [
      { translateY: (1 - menu.value) * 12 },
      { scale: 0.9 + 0.1 * menu.value },
    ],
  }));

  const opciones = useMemo(
    () => [
      {
        label: "Crear anuncio",
        Icono: IconoAnuncios,
        color: COLOR_ICONO_ANUNCIO,
        onPress: onAnuncio,
      },
      {
        label: "Crear publicación",
        Icono: IconoPublicaciones,
        color: COLOR_ICONO_PUBLICACION,
        onPress: onPublicacion,
      },
    ],
    [onAnuncio, onPublicacion],
  );

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.menuSombra,
        { bottom: bottom + ALTO_CAPSULA + 10 },
        opcionesStyle,
      ]}
    >
      <View style={styles.menuCard}>
        <LiquidGlassSurface isDark={isDark} styles={styles} />
        {opciones.map(({ label, Icono, color, onPress }, index) => (
          <PressableSuave
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            scaleTo={0.97}
            style={[styles.menuOpcion, index > 0 && styles.menuOpcionSeparador]}
          >
            <Text style={styles.menuEtiqueta}>{label}</Text>
            <Icono size={22} color={color} />
          </PressableSuave>
        ))}
      </View>
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navegación                                                                */
/* -------------------------------------------------------------------------- */

export function Navegacion({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 16 : Math.max(insets.bottom - 8, 8);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const menu = useSharedValue(0);

  useEffect(() => {
    setPendingTab(null);
  }, [activeTab]);

  const tabEfectivo = pendingTab ?? activeTab;
  const indiceTab = NAV_TABS.findIndex((tab) => tab.id === tabEfectivo);
  const huecoActivo =
    menuAbierto || tabEfectivo === "create" ? INDICE_CREAR : indiceTab;

  const huecoAnterior = useRef(huecoActivo);
  const ultimoIndiceArrastrado = useRef<number | null>(null);

  const posicion = useSharedValue(Math.max(huecoActivo, 0));
  const indicadorVisible = useSharedValue(huecoActivo >= 0 ? 1 : 0);
  const estirar = useSharedValue(0);
  const arrastrando = useSharedValue(0);
  const inicioArrastre = useSharedValue(0);
  const anchoHueco = useSharedValue(0);

  useEffect(() => {
    if (huecoActivo >= 0) {
      if (ultimoIndiceArrastrado.current === huecoActivo) {
        ultimoIndiceArrastrado.current = null;
      } else {
        posicion.set(withSpring(huecoActivo, SPRING_PILDORA));

        if (
          huecoAnterior.current >= 0 &&
          huecoAnterior.current !== huecoActivo
        ) {
          estirar.set(
            withSequence(
              withTiming(0.11, {
                duration: 150,
                easing: Easing.out(Easing.cubic),
              }),
              withSpring(0, { damping: 24, stiffness: 170 }),
            ),
          );
        }
      }
    }
    huecoAnterior.current = huecoActivo;
    indicadorVisible.set(withTiming(huecoActivo >= 0 ? 1 : 0, APARECER));
  }, [huecoActivo, posicion, indicadorVisible, estirar]);

  const abrirMenu = useCallback(() => {
    setPendingTab(null);
    setMenuAbierto(true);
    setMenuVisible(true);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    menu.set(
      withTiming(0, MENU_CERRAR, (finished) => {
        if (finished) {
          scheduleOnRN(setMenuVisible, false);
        }
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

  const medirCapsula = useCallback(
    (e: LayoutChangeEvent) => {
      const nuevoAncho =
        (e.nativeEvent.layout.width - MARGEN_CAPSULA * 2) / TOTAL_BOTONES;
      if (nuevoAncho > 0 && nuevoAncho !== anchoHueco.get()) {
        anchoHueco.set(nuevoAncho);
      }
    },
    [anchoHueco],
  );

  const handleCrearPublicacion = useCallback(() => {
    setPendingTab("create");
    cerrarMenu();
    onNavigate("create");
  }, [cerrarMenu, onNavigate]);

  const handleTabPress = useCallback(
    (tabId: Tab) => {
      if (tabId !== activeTab) {
        setPendingTab(tabId);
        if (menuAbierto) cerrarMenu();
        onNavigate(tabId);
      } else {
        setPendingTab(null);
        if (menuAbierto) cerrarMenu();
      }
    },
    [activeTab, cerrarMenu, menuAbierto, onNavigate],
  );

  const handleCreatePress = useCallback(() => {
    if (menuAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  }, [abrirMenu, cerrarMenu, menuAbierto]);

  const handleDropNavigate = useCallback(
    (targetIndex: number) => {
      ultimoIndiceArrastrado.current = targetIndex;

      if (targetIndex === INDICE_CREAR) {
        if (!menuAbierto) abrirMenu();
        return;
      }

      const targetTab = NAV_TABS[targetIndex];
      if (!targetTab) return;

      if (targetTab.id !== activeTab) {
        setPendingTab(targetTab.id);
        if (menuAbierto) cerrarMenu();
        onNavigate(targetTab.id);
      } else {
        setPendingTab(null);
        if (menuAbierto) cerrarMenu();
      }
    },
    [abrirMenu, activeTab, cerrarMenu, menuAbierto, onNavigate],
  );

  /** Gesto horizontal para jalar la píldora Liquid Glass por los 5 botones y soltarla */
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onStart((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          arrastrando.set(
            withSpring(1, { damping: 22, stiffness: 220, mass: 0.7 }),
          );

          if (indicadorVisible.get() < 0.5) {
            const indiceToque = Math.min(
              Math.max(Math.floor((e.x - MARGEN_CAPSULA) / ancho), 0),
              MAX_INDEX,
            );
            posicion.set(indiceToque);
            indicadorVisible.set(withTiming(1, APARECER));
          }

          inicioArrastre.set(posicion.get());
        })
        .onUpdate((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          const crudo = inicioArrastre.get() + e.translationX / ancho;

          let conResistencia = crudo;
          if (crudo < 0) {
            conResistencia = crudo * 0.25;
          } else if (crudo > MAX_INDEX) {
            conResistencia = MAX_INDEX + (crudo - MAX_INDEX) * 0.25;
          }

          posicion.set(conResistencia);

          const deformacion = Math.min(Math.abs(e.velocityX) / 2200, 0.18);
          estirar.set(withTiming(deformacion, { duration: 80 }));
        })
        .onEnd((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          const impulso = Math.max(Math.min(e.velocityX * 0.00009, 0.3), -0.3);
          const objetivo = Math.min(
            Math.max(Math.round(posicion.get() + impulso), 0),
            MAX_INDEX,
          );
          const velocidadRelativa = Math.max(
            Math.min(e.velocityX / ancho, 5),
            -5,
          );

          posicion.set(
            withSpring(objetivo, {
              ...SPRING_PILDORA,
              velocity: velocidadRelativa,
            }),
          );
          arrastrando.set(
            withSpring(0, { damping: 24, stiffness: 190, mass: 0.8 }),
          );
          estirar.set(withSpring(0, { damping: 24, stiffness: 180 }));

          scheduleOnRN(handleDropNavigate, objetivo);
        })
        .onFinalize(() => {
          arrastrando.set(withSpring(0, { damping: 24, stiffness: 190 }));
          estirar.set(withSpring(0, { damping: 24, stiffness: 180 }));
        }),
    [
      anchoHueco,
      arrastrando,
      estirar,
      handleDropNavigate,
      indicadorVisible,
      inicioArrastre,
      posicion,
    ],
  );

  const indicadorStyle = useAnimatedStyle(() => {
    const ancho = anchoHueco.get();
    const lift = arrastrando.get();
    const stretch = estirar.get();

    return {
      width: ancho,
      opacity: ancho > 0 ? indicadorVisible.get() : 0,
      transform: [
        { translateX: posicion.get() * ancho },
        { scaleX: 1 + 0.06 * lift + stretch },
        { scaleY: 1 + 0.04 * lift - stretch * 0.35 },
      ],
    };
  });

  return (
    <View pointerEvents="box-none" style={styles.contenedorPantalla}>
      {menuVisible && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={cerrarMenu}
          style={StyleSheet.absoluteFill}
        />
      )}

      <MenuCrear
        visible={menuVisible}
        menu={menu}
        isDark={isDark}
        bottom={bottomInset}
        onAnuncio={cerrarMenu}
        onPublicacion={handleCrearPublicacion}
        styles={styles}
      />

      <View style={[styles.navigationRow, { bottom: bottomInset }]}>
        <GestureDetector gesture={panGesture}>
          <View style={[styles.sombra, styles.capsulaSombra]}>
            <View
              accessibilityRole="tablist"
              onLayout={medirCapsula}
              style={styles.capsula}
            >
              <LiquidGlassSurface isDark={isDark} styles={styles} />

              <Animated.View
                pointerEvents="none"
                style={[styles.indicador, indicadorStyle]}
              />

              {NAV_TABS.map((tab, indice) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  indice={indice}
                  selected={!menuAbierto && tabEfectivo === tab.id}
                  posicion={posicion}
                  indicadorVisible={indicadorVisible}
                  showBadge={tab.id === "chats" && hasUnreadChats}
                  isDark={isDark}
                  onPress={handleTabPress}
                  styles={styles}
                />
              ))}

              <CreateSlotButton
                selected={menuAbierto || tabEfectivo === "create"}
                posicion={posicion}
                indicadorVisible={indicadorVisible}
                onPress={handleCreatePress}
                isDark={isDark}
                styles={styles}
              />
            </View>
          </View>
        </GestureDetector>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Estilos Liquid Glass                                                      */
/* -------------------------------------------------------------------------- */

function createStyles(isDark: boolean) {
  const android = Platform.OS === "android";
  const colors = isDark
    ? {
        cristal: android ? "rgba(30, 30, 34, 0.94)" : "rgba(28, 28, 32, 0.62)",
        borde: "rgba(255, 255, 255, 0.16)",
        bordeSuperior: "rgba(255, 255, 255, 0.34)",
        reflejo: "rgba(255, 255, 255, 0.10)",
        separador: "rgba(255, 255, 255, 0.10)",
        indicador: "#FFFFFF",
        bordeIndicador: "rgba(255, 255, 255, 0.9)",
        sombra:
          "0 10px 28px rgba(0, 0, 0, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 2px rgba(0, 0, 0, 0.35)",
        sombraIndicador:
          "0 4px 12px rgba(0, 0, 0, 0.32), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1px 1.5px rgba(0, 0, 0, 0.08)",
        fondoContador: "#222226",
        text: "#FFFFFF",
      }
    : {
        cristal: android
          ? "rgba(248, 248, 250, 0.96)"
          : "rgba(255, 255, 255, 0.72)",
        borde: "rgba(255, 255, 255, 0.85)",
        bordeSuperior: "#FFFFFF",
        reflejo: "rgba(255, 255, 255, 0.65)",
        separador: "rgba(0, 0, 0, 0.06)",
        indicador: "#FFFFFF",
        bordeIndicador: "#FFFFFF",
        sombra:
          "0 10px 28px rgba(0, 0, 0, 0.12), inset 0 1.5px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(0, 0, 0, 0.06)",
        sombraIndicador:
          "0 3px 10px rgba(0, 0, 0, 0.08), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1px 1.5px rgba(0, 0, 0, 0.05)",
        fondoContador: "#EBEBEF",
        text: "#101010",
      };

  return StyleSheet.create({
    contenedorPantalla: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    },

    navigationRow: {
      position: "absolute",
      left: 14,
      right: 14,
      flexDirection: "row",
      alignItems: "center",
    },

    sombra: {
      borderRadius: ALTO_CAPSULA / 2,
      boxShadow: colors.sombra,
    },

    capsulaSombra: { flex: 1 },

    capsula: {
      height: ALTO_CAPSULA,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: MARGEN_CAPSULA,
      borderRadius: ALTO_CAPSULA / 2,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
    },

    cristalTinte: {
      backgroundColor: colors.cristal,
    },

    reflejoSuperior: {
      position: "absolute",
      top: 0,
      left: 18,
      right: 18,
      height: 1.5,
      borderRadius: 1,
      backgroundColor: colors.reflejo,
    },

    indicador: {
      position: "absolute",
      left: MARGEN_CAPSULA,
      top: MARGEN_CAPSULA,
      bottom: MARGEN_CAPSULA,
      borderRadius: (ALTO_CAPSULA - MARGEN_CAPSULA * 2) / 2,
      backgroundColor: colors.indicador,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.bordeIndicador,
      boxShadow: colors.sombraIndicador,
    },

    hueco: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },

    icono: {
      width: TAMANO_ICONO + 3,
      height: TAMANO_ICONO + 3,
      alignItems: "center",
      justifyContent: "center",
    },

    iconoCapa: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },

    etiquetaContenedor: {
      height: 12,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    etiqueta: {
      position: "absolute",
      fontSize: 11,
      lineHeight: 12,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: -0.1,
    },

    punto: {
      position: "absolute",
      top: -1,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF3366",
      borderWidth: 1,
      borderColor: colors.fondoContador,
    },

    menuSombra: {
      position: "absolute",
      right: 14,
      borderRadius: 22,
      boxShadow: colors.sombra,
      transformOrigin: "right bottom",
    },

    menuCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
      paddingVertical: 4,
      paddingHorizontal: 6,
    },

    menuOpcion: {
      height: 44,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
    },

    menuOpcionSeparador: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separador,
    },

    menuEtiqueta: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
  });
}

export default Navegacion;
