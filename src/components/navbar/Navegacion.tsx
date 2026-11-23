import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { NavigationIcon } from "@/components/iconos";
import {
  coloresCristal,
  fondoCristalVisto,
} from "@/features/busqueda/components/PildoraCristal";
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
import { useLatestRef } from "@/hooks/useLatestRef";
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
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export interface NavegacionProps {
  activeTab: Tab | null;
  onNavigate: (tab: Tab) => void;
  isDark?: boolean;
  hasUnreadChats?: boolean;
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

const TOTAL_BOTONES = NAV_TABS.length;
const MAX_INDEX = TOTAL_BOTONES - 1;
const SEPARACION_CREAR = 10;

export const ALTO_CAPSULA = 60;
const MARGEN_CAPSULA = 5;
const TAMANO_ICONO = 23;
const TAMANO_ICONO_CREAR = 34;

const ICONOS_LINEA: Partial<
  Record<Tab, ComponentType<{ size?: number; color?: string }>>
> = {
  home: IconoInicioLinea,
  favorites: IconoFavoritoLinea,
  chats: IconoChatLinea,
  profile: IconoPerfilLinea,
};

/* -------------------------------------------------------------------------- */
/*  Curvas sedosas estilo iOS (desaceleración larga, cero rebote)             */
/* -------------------------------------------------------------------------- */

const CURVA_SEDOSA = Easing.bezier(0.16, 1, 0.3, 1);
const TIMING_PILDORA = { duration: 310, easing: CURVA_SEDOSA };
const APARECER = { duration: 160, easing: CURVA_SEDOSA };

const MENU_ABRIR = { duration: 210, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const MENU_CERRAR = { duration: 140, easing: Easing.out(Easing.cubic) };

const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

type Estilos = ReturnType<typeof createStyles>;

const LiquidGlassSurface = memo(function LiquidGlassSurface({
  isDark,
  styles,
}: {
  isDark: boolean;
  styles: Estilos;
}) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.cristalTinte]}
      />
      {Platform.OS !== "android" && (
        <BlurView
          intensity={30}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
    </>
  );
});

const ACCION_ACTIVAR = [{ name: "activate" as const }];

const TabButton = memo(function TabButton({
  tab,
  indice,
  selected,
  posicion,
  indicadorVisible,
  showBadge,
  isDark,
  onPress,
  presionado,
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
  presionado: SharedValue<number>;
  styles: Estilos;
}) {
  const activo = useDerivedValue(
    () =>
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
      indicadorVisible.get(),
  );

  const activeStyle = useAnimatedStyle(() => ({ opacity: activo.get() }));
  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - activo.get() }));

  // Micro-escala suave solo en los iconos al presionar
  const escalaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: presionado.get() === indice ? 0.93 : 1 }],
  }));

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  const colorActivo = isDark ? "#F1F5F9" : "#101010";
  const IconoLinea = ICONOS_LINEA[tab.id];

  return (
    <Animated.View
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.label}
      accessibilityActions={ACCION_ACTIVAR}
      onAccessibilityAction={() => onPress(tab.id)}
      style={[styles.hueco, escalaStyle]}
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
    </Animated.View>
  );
});

const CreateSlotButton = memo(function CreateSlotButton({
  selected,
  onPress,
  isDark,
  styles,
}: {
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  styles: Estilos;
}) {
  const activo = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    activo.set(withTiming(selected ? 1 : 0, APARECER));
  }, [selected, activo]);

  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - activo.get() }));
  const activeStyle = useAnimatedStyle(() => ({ opacity: activo.get() }));

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  const colorActivo = isDark ? "#F1F5F9" : "#101010";

  return (
    <View style={[styles.sombra, styles.crearSombra]}>
      <View style={styles.crearCirculo}>
        <LiquidGlassSurface isDark={isDark} styles={styles} />
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel="Publicar producto"
          onPress={onPress}
          scaleTo={0.93}
          style={styles.hueco}
        >
          <View style={styles.iconoCrear}>
            <Animated.View style={[styles.iconoCapa, inactiveStyle]}>
              <NavigationIcon
                name="add"
                size={TAMANO_ICONO_CREAR}
                color={colorInactivo}
              />
            </Animated.View>
            <Animated.View style={[styles.iconoCapa, activeStyle]}>
              <NavigationIcon
                name="add"
                size={TAMANO_ICONO_CREAR}
                color={colorActivo}
              />
            </Animated.View>
          </View>
        </PressableScale>
      </View>
    </View>
  );
});

export function MenuCrear({
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
      { translateY: (1 - menu.value) * 10 },
      { scale: 0.94 + 0.06 * menu.value },
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

function NavegacionBase({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === "web" ? 16 : Math.max(insets.bottom - 12, 8);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const menu = useSharedValue(0);

  const [tabPrevia, setTabPrevia] = useState(activeTab);
  if (tabPrevia !== activeTab) {
    setTabPrevia(activeTab);
    setPendingTab(null);
  }

  const tabEfectivo = pendingTab ?? activeTab;
  const indiceTab = NAV_TABS.findIndex((tab) => tab.id === tabEfectivo);
  const crearActivo = menuAbierto || tabEfectivo === "create";
  const huecoActivo = crearActivo ? -1 : indiceTab;

  const huecoAnterior = useRef(huecoActivo);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const posicion = useSharedValue(Math.max(huecoActivo, 0));
  const destino = useSharedValue(Math.max(huecoActivo, 0));
  const indicadorVisible = useSharedValue(huecoActivo >= 0 ? 1 : 0);
  const arrastrando = useSharedValue(0);
  const inicioArrastre = useSharedValue(0);
  const anchoHueco = useSharedValue(0);
  const [anchoPildora, setAnchoPildora] = useState(0);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  /**
   * Mueve la píldora de forma continua y sedosa hacia el objetivo.
   */
  const moverSuave = useCallback(
    (objetivo: number, desdeVisible: boolean) => {
      cancelAnimation(posicion);
      destino.set(objetivo);

      if (!desdeVisible) {
        posicion.set(objetivo);
      } else {
        posicion.set(withTiming(objetivo, TIMING_PILDORA));
      }
      indicadorVisible.set(withTiming(1, APARECER));
    },
    [posicion, destino, indicadorVisible],
  );

  useEffect(() => {
    if (huecoActivo >= 0) {
      if (huecoAnterior.current !== huecoActivo) {
        moverSuave(huecoActivo, huecoAnterior.current >= 0);
      }
    } else {
      indicadorVisible.set(withTiming(0, APARECER));
    }
    huecoAnterior.current = huecoActivo;
  }, [huecoActivo, moverSuave, indicadorVisible]);

  const abrirMenu = useCallback(() => {
    setPendingTab(null);
    setMenuAbierto(true);
    setMenuVisible(true);
    cancelAnimation(menu);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    cancelAnimation(menu);
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
        setAnchoPildora(nuevoAncho);
      }
    },
    [anchoHueco],
  );

  /**
   * Desacopla ligeramente el cambio de pantalla (45ms) para que la animación
   * nativa arranque completamente libre de tirones antes de montar la nueva ruta.
   */
  const navegarDesacoplado = useCallback(
    (tabId: Tab) => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => {
        onNavigate(tabId);
      }, 45);
    },
    [onNavigate],
  );

  const handleCrearPublicacion = useCallback(() => {
    setPendingTab("create");
    cerrarMenu();
    navegarDesacoplado("create");
  }, [cerrarMenu, navegarDesacoplado]);

  const handleTabPressActual = useCallback(
    (tabId: Tab) => {
      if (menuAbierto) cerrarMenu();
      if (tabId !== activeTab) {
        setPendingTab(tabId);
        navegarDesacoplado(tabId);
      } else {
        setPendingTab(null);
      }
    },
    [activeTab, cerrarMenu, menuAbierto, navegarDesacoplado],
  );

  const handleCreatePressActual = useCallback(() => {
    if (menuAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  }, [abrirMenu, cerrarMenu, menuAbierto]);

  const tabPressRef = useLatestRef(handleTabPressActual);
  const handleTabPress = useCallback(
    (tabId: Tab) => tabPressRef.current(tabId),
    [tabPressRef],
  );
  const createPressRef = useLatestRef(handleCreatePressActual);
  const handleCreatePress = useCallback(
    () => createPressRef.current(),
    [createPressRef],
  );

  const handleDropNavigate = useCallback(
    (targetIndex: number) => {
      const targetTab = NAV_TABS[targetIndex];
      if (!targetTab) return;

      if (menuAbierto) cerrarMenu();
      if (targetTab.id !== activeTab) {
        setPendingTab(targetTab.id);
        navegarDesacoplado(targetTab.id);
      } else {
        setPendingTab(null);
      }
    },
    [activeTab, cerrarMenu, menuAbierto, navegarDesacoplado],
  );

  const handleDropRef = useLatestRef(handleDropNavigate);
  const soltarEnHueco = useCallback(
    (hueco: number) => handleDropRef.current(hueco),
    [handleDropRef],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .onStart((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          cancelAnimation(posicion);
          arrastrando.set(
            withTiming(1, { duration: 130, easing: CURVA_SEDOSA }),
          );

          if (indicadorVisible.get() < 0.5) {
            const indiceToque = Math.min(
              Math.max(Math.floor((e.x - MARGEN_CAPSULA) / ancho), 0),
              MAX_INDEX,
            );
            posicion.set(indiceToque);
            destino.set(indiceToque);
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
            conResistencia = crudo * 0.22;
          } else if (crudo > MAX_INDEX) {
            conResistencia = MAX_INDEX + (crudo - MAX_INDEX) * 0.22;
          }

          posicion.set(conResistencia);
          destino.set(conResistencia);
        })
        .onEnd((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          const impulso = Math.max(Math.min(e.velocityX * 0.0001, 0.35), -0.35);
          const objetivo = Math.min(
            Math.max(Math.round(posicion.get() + impulso), 0),
            MAX_INDEX,
          );

          destino.set(objetivo);
          posicion.set(withTiming(objetivo, TIMING_PILDORA));
          arrastrando.set(
            withTiming(0, { duration: 160, easing: CURVA_SEDOSA }),
          );

          scheduleOnRN(soltarEnHueco, objetivo);
        })
        .onFinalize(() => {
          arrastrando.set(
            withTiming(0, { duration: 160, easing: CURVA_SEDOSA }),
          );
        }),
    [
      anchoHueco,
      arrastrando,
      destino,
      soltarEnHueco,
      indicadorVisible,
      inicioArrastre,
      posicion,
    ],
  );

  const presionado = useSharedValue(-1);
  const tocarHueco = useCallback(
    (hueco: number) => {
      const tab = NAV_TABS[hueco];
      if (tab) handleTabPress(tab.id);
    },
    [handleTabPress],
  );

  const gestoCapsula = useMemo(() => {
    const huecoEn = (x: number) => {
      "worklet";
      const ancho = anchoHueco.get();
      if (ancho <= 0) return -1;
      return Math.min(
        Math.max(Math.floor((x - MARGEN_CAPSULA) / ancho), 0),
        MAX_INDEX,
      );
    };
    const toque = Gesture.Tap()
      .maxDistance(12)
      .onBegin((e) => {
        presionado.set(huecoEn(e.x));
      })
      .onEnd((e, exito) => {
        const hueco = huecoEn(e.x);
        if (exito && hueco >= 0) scheduleOnRN(tocarHueco, hueco);
      })
      .onFinalize(() => {
        presionado.set(-1);
      });
    return Gesture.Race(panGesture, toque);
  }, [panGesture, anchoHueco, presionado, tocarHueco]);

  /**
   * Deformación líquida automática y orgánica:
   * Se estira suavemente según la distancia instantánea al destino y vuelve
   * a 1.0 de forma continua sin pasos intermedios ni saltos.
   */
  const indicadorStyle = useAnimatedStyle(() => {
    const ancho = anchoHueco.get();
    const lift = arrastrando.get();
    const distancia = Math.min(Math.abs(destino.get() - posicion.get()), 1.5);
    const estirarFluido = distancia * 0.09;

    return {
      opacity: ancho > 0 ? indicadorVisible.get() : 0,
      transform: [
        { translateX: posicion.get() * ancho },
        { scaleX: 1 + 0.04 * lift + estirarFluido },
        { scaleY: 1 + 0.03 * lift - estirarFluido * 0.35 },
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
        <GestureDetector gesture={gestoCapsula}>
          <View style={[styles.sombra, styles.capsulaSombra]}>
            <View
              accessibilityRole="tablist"
              onLayout={medirCapsula}
              style={styles.capsula}
            >
              <LiquidGlassSurface isDark={isDark} styles={styles} />

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicador,
                  { width: anchoPildora },
                  indicadorStyle,
                ]}
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
                  presionado={presionado}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        </GestureDetector>

        <CreateSlotButton
          selected={crearActivo}
          onPress={handleCreatePress}
          isDark={isDark}
          styles={styles}
        />
      </View>
    </View>
  );
}

const SOMBRA_CRISTAL = "0 4px 14px rgba(0, 0, 0, 0.08)";

export function createStyles(isDark: boolean) {
  const vidrio = coloresCristal(isDark);
  const colors = isDark
    ? {
        cristal: fondoCristalVisto(true),
        borde: vidrio.borde,
        bordeSuperior: vidrio.borde,
        separador: "rgba(255, 255, 255, 0.10)",
        indicador: "rgba(255, 255, 255, 0.14)",
        sombra: SOMBRA_CRISTAL,
        fondoContador: "#222226",
        text: "#FFFFFF",
      }
    : {
        cristal: fondoCristalVisto(false),
        borde: vidrio.borde,
        bordeSuperior: vidrio.borde,
        separador: "rgba(0, 0, 0, 0.06)",
        indicador: "rgba(120, 120, 128, 0.14)",
        sombra: SOMBRA_CRISTAL,
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
      left: 18,
      right: 18,
      flexDirection: "row",
      alignItems: "center",
    },

    sombra: {
      borderRadius: ALTO_CAPSULA / 2,
      boxShadow: colors.sombra,
    },

    capsulaSombra: { flex: 1 },

    crearSombra: { marginLeft: SEPARACION_CREAR },

    crearCirculo: {
      width: ALTO_CAPSULA,
      height: ALTO_CAPSULA,
      borderRadius: ALTO_CAPSULA / 2,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },

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

    indicador: {
      position: "absolute",
      left: MARGEN_CAPSULA,
      top: MARGEN_CAPSULA,
      bottom: MARGEN_CAPSULA,
      borderRadius: (ALTO_CAPSULA - MARGEN_CAPSULA * 2) / 2,
      backgroundColor: colors.indicador,
    },

    hueco: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    icono: {
      width: TAMANO_ICONO + 3,
      height: TAMANO_ICONO + 3,
      alignItems: "center",
      justifyContent: "center",
    },

    iconoCrear: {
      width: TAMANO_ICONO_CREAR + 4,
      height: TAMANO_ICONO_CREAR + 4,
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

export const Navegacion = memo(NavegacionBase);

export default Navegacion;
