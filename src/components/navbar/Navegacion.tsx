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
  Modal,
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
/*  Animaciones Liquid Glass (corren en el hilo de UI con Reanimated)         */
/* -------------------------------------------------------------------------- */

const DESLIZAR = { duration: 290, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const APARECER = { duration: 150, easing: Easing.out(Easing.cubic) };
const SPRING_SOLTAR = { damping: 16, stiffness: 220, mass: 0.72 };

const MENU_ABRIR = { duration: 220, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const MENU_CERRAR = { duration: 150, easing: Easing.out(Easing.cubic) };
const MENU_BLUR = 28;

const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

type Estilos = ReturnType<typeof createStyles>;

/**
 * Superficie Liquid Glass única: desenfoque nativo (iOS/Web), tinte translúcido
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
  const colorActivo = isDark ? "#FFFFFF" : "#101010";
  const IconoLinea = ICONOS_LINEA[tab.id];

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.label}
      onPress={() => onPress(tab.id)}
      scaleTo={0.9}
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
          style={[
            styles.etiqueta,
            styles.etiquetaActiva,
            { color: colorActivo },
            activeStyle,
          ]}
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
  const colorActivo = isDark ? "#FFFFFF" : "#101010";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel="Publicar producto"
      onPress={onPress}
      scaleTo={0.9}
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
          style={[
            styles.etiqueta,
            styles.etiquetaActiva,
            { color: colorActivo },
            activeStyle,
          ]}
        >
          Crear
        </Animated.Text>
      </View>
    </PressableScale>
  );
});

/** Menú flotante de acciones al pulsar o soltar en Crear */
function MenuCrear({
  visible,
  menu,
  isDark,
  bottom,
  onClose,
  onAnuncio,
  onPublicacion,
  styles,
}: {
  visible: boolean;
  menu: SharedValue<number>;
  isDark: boolean;
  bottom: number;
  onClose: () => void;
  onAnuncio: () => void;
  onPublicacion: () => void;
  styles: Estilos;
}) {
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: menu.value,
  }));

  const opcionesStyle = useAnimatedStyle(() => ({
    opacity: menu.value,
    transform: [
      { translateY: (1 - menu.value) * 14 },
      { scale: 0.85 + 0.15 * menu.value },
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
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, backdropStyle]}
      >
        {Platform.OS !== "android" && (
          <BlurView
            intensity={MENU_BLUR}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, styles.menuVelo]} />
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.menuCrear,
          { bottom: bottom + ALTO_CAPSULA + 12 },
          opcionesStyle,
        ]}
      >
        {opciones.map(({ label, Icono, color, onPress }) => (
          <PressableSuave
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            scaleTo={0.96}
            style={styles.menuOpcion}
          >
            <Text style={styles.menuEtiqueta}>{label}</Text>
            <Icono size={24} color={color} />
          </PressableSuave>
        ))}
      </Animated.View>
    </Modal>
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
  const bottomInset = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menu = useSharedValue(0);

  const indiceTab = NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const huecoActivo =
    menuAbierto || activeTab === "create" ? INDICE_CREAR : indiceTab;

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
      // Si el cambio vino de soltar el arrastre, el spring de onEnd ya está en curso
      if (ultimoIndiceArrastrado.current === huecoActivo) {
        ultimoIndiceArrastrado.current = null;
      } else {
        posicion.set(withTiming(huecoActivo, DESLIZAR));

        // Efecto gota líquida al tocar cualquier módulo (incluido Crear)
        if (
          huecoAnterior.current >= 0 &&
          huecoAnterior.current !== huecoActivo
        ) {
          estirar.set(
            withSequence(
              withTiming(0.16, {
                duration: 120,
                easing: Easing.out(Easing.quad),
              }),
              withSpring(0, { damping: 14, stiffness: 210, mass: 0.7 }),
            ),
          );
        }
      }
    }
    huecoAnterior.current = huecoActivo;
    indicadorVisible.set(withTiming(huecoActivo >= 0 ? 1 : 0, APARECER));
  }, [huecoActivo, posicion, indicadorVisible, estirar]);

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

  const abrirMenu = useCallback(() => {
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

  const handleCrearPublicacion = useCallback(() => {
    cerrarMenu();
    onNavigate("create");
  }, [cerrarMenu, onNavigate]);

  const handleTabPress = useCallback(
    (tabId: Tab) => {
      if (tabId !== activeTab) onNavigate(tabId);
    },
    [activeTab, onNavigate],
  );

  const handleDropNavigate = useCallback(
    (targetIndex: number) => {
      ultimoIndiceArrastrado.current = targetIndex;

      if (targetIndex === INDICE_CREAR) {
        abrirMenu();
        return;
      }

      const targetTab = NAV_TABS[targetIndex];
      if (targetTab && targetTab.id !== activeTab) {
        onNavigate(targetTab.id);
      }
    },
    [abrirMenu, activeTab, onNavigate],
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
            withSpring(1, { damping: 15, stiffness: 260, mass: 0.6 }),
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

          // Efecto liga solo en los extremos exteriores (antes de Inicio y después de Crear)
          let conResistencia = crudo;
          if (crudo < 0) {
            conResistencia = crudo * 0.25;
          } else if (crudo > MAX_INDEX) {
            conResistencia = MAX_INDEX + (crudo - MAX_INDEX) * 0.25;
          }

          posicion.set(conResistencia);

          // Elongación líquida proporcional a la velocidad de arrastre
          const deformacion = Math.min(Math.abs(e.velocityX) / 1800, 0.26);
          estirar.set(withTiming(deformacion, { duration: 60 }));
        })
        .onEnd((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          const proyectado = posicion.get() + e.velocityX * 0.00014;
          const objetivo = Math.min(
            Math.max(Math.round(proyectado), 0),
            MAX_INDEX,
          );

          posicion.set(withSpring(objetivo, SPRING_SOLTAR));
          arrastrando.set(
            withSpring(0, { damping: 14, stiffness: 220, mass: 0.65 }),
          );
          estirar.set(withSpring(0, { damping: 12, stiffness: 190 }));

          scheduleOnRN(handleDropNavigate, objetivo);
        })
        .onFinalize(() => {
          arrastrando.set(withSpring(0));
          estirar.set(withSpring(0));
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
        { scaleX: 1 + 0.1 * lift + stretch },
        { scaleY: 1 + 0.06 * lift - stretch * 0.45 },
      ],
    };
  });

  return (
    <View style={[styles.navigationRow, { bottom: bottomInset }]}>
      <GestureDetector gesture={panGesture}>
        <View style={[styles.sombra, styles.capsulaSombra]}>
          <View
            accessibilityRole="tablist"
            onLayout={medirCapsula}
            style={styles.capsula}
          >
            <LiquidGlassSurface isDark={isDark} styles={styles} />

            {/* Píldora activa arrastrable con acabado Liquid Glass */}
            <Animated.View
              pointerEvents="none"
              style={[styles.indicador, indicadorStyle]}
            />

            {NAV_TABS.map((tab, indice) => (
              <TabButton
                key={tab.id}
                tab={tab}
                indice={indice}
                selected={!menuAbierto && activeTab === tab.id}
                posicion={posicion}
                indicadorVisible={indicadorVisible}
                showBadge={tab.id === "chats" && hasUnreadChats}
                isDark={isDark}
                onPress={handleTabPress}
                styles={styles}
              />
            ))}

            <CreateSlotButton
              selected={menuAbierto || activeTab === "create"}
              posicion={posicion}
              indicadorVisible={indicadorVisible}
              onPress={abrirMenu}
              isDark={isDark}
              styles={styles}
            />
          </View>
        </View>
      </GestureDetector>

      <MenuCrear
        visible={menuVisible}
        menu={menu}
        isDark={isDark}
        bottom={bottomInset}
        onClose={cerrarMenu}
        onAnuncio={cerrarMenu}
        onPublicacion={handleCrearPublicacion}
        styles={styles}
      />
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
        cristal: android ? "rgba(30, 30, 34, 0.94)" : "rgba(28, 28, 32, 0.56)",
        borde: "rgba(255, 255, 255, 0.16)",
        bordeSuperior: "rgba(255, 255, 255, 0.34)",
        reflejo: "rgba(255, 255, 255, 0.10)",
        indicador: "rgba(255, 255, 255, 0.16)",
        bordeIndicador: "rgba(255, 255, 255, 0.28)",
        sombra:
          "0 10px 28px rgba(0, 0, 0, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.25), inset 0 -1px 2px rgba(0, 0, 0, 0.35)",
        sombraIndicador:
          "0 3px 10px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.32), inset 0 -1px 1.5px rgba(0, 0, 0, 0.22)",
        fondoContador: "#222226",
        text: "#FFFFFF",
        velo: android ? "rgba(16, 16, 18, 0.94)" : "rgba(16, 16, 18, 0.78)",
      }
    : {
        cristal: android
          ? "rgba(248, 248, 250, 0.95)"
          : "rgba(255, 255, 255, 0.58)",
        borde: "rgba(255, 255, 255, 0.78)",
        bordeSuperior: "#FFFFFF",
        reflejo: "rgba(255, 255, 255, 0.55)",
        indicador: "rgba(255, 255, 255, 0.88)",
        bordeIndicador: "#FFFFFF",
        sombra:
          "0 10px 28px rgba(0, 0, 0, 0.11), inset 0 1.5px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(0, 0, 0, 0.06)",
        sombraIndicador:
          "0 3px 10px rgba(0, 0, 0, 0.08), inset 0 1.5px 1px rgba(255, 255, 255, 1), inset 0 -1px 1.5px rgba(0, 0, 0, 0.05)",
        fondoContador: "#EBEBEF",
        text: "#101010",
        velo: android
          ? "rgba(255, 255, 255, 0.94)"
          : "rgba(255, 255, 255, 0.78)",
      };

  return StyleSheet.create({
    navigationRow: {
      position: "absolute",
      left: 14,
      right: 14,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 999,
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

    /** Reflejo especular superior que acentúa la curvatura del vidrio */
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
      fontSize: 10,
      lineHeight: 12,
      fontFamily: "Inter_500Medium",
      letterSpacing: -0.1,
    },

    etiquetaActiva: {
      fontFamily: "Inter_600SemiBold",
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

    menuVelo: {
      backgroundColor: colors.velo,
    },

    menuCrear: {
      position: "absolute",
      right: 24,
      alignItems: "flex-end",
      transformOrigin: "right bottom",
    },

    menuOpcion: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    menuEtiqueta: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 16,
    },
  });
}

export default Navegacion;
