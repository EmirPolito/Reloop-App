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
import { useLatestRef } from "@/hooks/useLatestRef";
import type { IconName } from "@/features/shared/constants";
import { BlurView } from "expo-blur";
import {
  coloresCristal,
  fondoCristalVisto,
} from "@/features/busqueda/components/PildoraCristal";
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
  useDerivedValue,
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

/** 4 pestañas en la cápsula; el botón de crear va aparte, en su propio círculo */
const TOTAL_BOTONES = NAV_TABS.length;
const MAX_INDEX = TOTAL_BOTONES - 1;
const SEPARACION_CREAR = 10;

const ALTO_CAPSULA = 60;
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
/*  Animaciones Liquid Glass (curva fluida estilo Apple en hilo de UI)        */
/* -------------------------------------------------------------------------- */

/**
 * Arranca rápido y frena con suavidad, casi sin rebote. Es un resorte rígido (asienta en
 * ~0.2 s): el anterior era igual de amortiguado pero tan blando que tardaba más de medio
 * segundo en llegar y se sentía lento.
 */
const SPRING_PILDORA = { damping: 30, stiffness: 340, mass: 0.8 };
const APARECER = { duration: 120, easing: Easing.out(Easing.cubic) };

const MENU_ABRIR = { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const MENU_CERRAR = { duration: 110, easing: Easing.out(Easing.cubic) };

const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

type Estilos = ReturnType<typeof createStyles>;

/**
 * Superficie de cristal, igual a la de los buscadores (`PildoraCristal`): el tinte va debajo
 * y el desenfoque encima, sin reflejo ni brillos (se veía metálico y más transparente).
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

/**
 * Pestaña de la cápsula: solo el icono (el nombre del módulo queda para el lector de pantalla).
 * El toque no lo atiende ella sino el gesto de la cápsula (ver `gestoCapsula`); aquí solo se
 * encoge un poco mientras se presiona.
 */
/** Acción del lector de pantalla para activar una pestaña */
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
  /** Índice de la pestaña bajo el dedo (-1 si ninguna) */
  presionado: SharedValue<number>;
  styles: Estilos;
}) {
  // Un solo cálculo por cuadro; los dos estilos solo lo leen
  const activo = useDerivedValue(
    () =>
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
      indicadorVisible.get(),
  );
  const activeStyle = useAnimatedStyle(() => ({ opacity: activo.get() }));
  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - activo.get() }));
  const escalaStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(presionado.get() === indice ? 0.92 : 1, {
          duration: 90,
        }),
      },
    ],
  }));

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  // Sobre la pastilla gris: oscuro en claro y claro en oscuro
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

/** Botón de crear: círculo de cristal separado de la cápsula de pestañas */
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
  const colorActivo = "#101010";

  return (
    <View style={[styles.sombra, styles.crearSombra]}>
      <View style={styles.crearCirculo}>
        <LiquidGlassSurface isDark={isDark} styles={styles} />
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel="Publicar producto"
          onPress={onPress}
          scaleTo={0.92}
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

function NavegacionBase({
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

  // Al llegar la pestaña de verdad, se descarta la que se esperaba (se ajusta durante el
  // render: con un efecto la barra se dibujaba una vez de más en cada cambio)
  const [tabPrevia, setTabPrevia] = useState(activeTab);
  if (tabPrevia !== activeTab) {
    setTabPrevia(activeTab);
    setPendingTab(null);
  }

  const tabEfectivo = pendingTab ?? activeTab;
  const indiceTab = NAV_TABS.findIndex((tab) => tab.id === tabEfectivo);
  // Con el menú de crear abierto (o en crear) la píldora se oculta: Crear tiene su propio fondo
  const crearActivo = menuAbierto || tabEfectivo === "create";
  const huecoActivo = crearActivo ? -1 : indiceTab;

  const huecoAnterior = useRef(huecoActivo);
  const ultimoIndiceArrastrado = useRef<number | null>(null);

  const posicion = useSharedValue(Math.max(huecoActivo, 0));
  const indicadorVisible = useSharedValue(huecoActivo >= 0 ? 1 : 0);
  const estirar = useSharedValue(0);
  const arrastrando = useSharedValue(0);
  const inicioArrastre = useSharedValue(0);
  const anchoHueco = useSharedValue(0);
  // El ancho de la píldora va como estilo normal (cambia solo al medir): animarlo obligaba a
  // recalcular el layout en cada cuadro del deslizamiento
  const [anchoPildora, setAnchoPildora] = useState(0);

  /** Desliza la píldora a un hueco con el estiramiento de siempre (todo en el hilo de UI) */
  const moverPildora = useCallback(
    (hueco: number, conEstiramiento: boolean) => {
      posicion.set(withSpring(hueco, SPRING_PILDORA));
      if (conEstiramiento) {
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
      indicadorVisible.set(withTiming(1, APARECER));
    },
    [posicion, estirar, indicadorVisible],
  );

  /**
   * Al tocar una pestaña la píldora arranca en ese mismo instante y la navegación (que es lo
   * pesado: monta la pantalla) se manda un cuadro después. Así el toque se siente inmediato y
   * la animación ya corre en el hilo de UI cuando el hilo de JS se ocupa de la pantalla nueva.
   */
  const irAPestana = useCallback(
    (hueco: number, tabId: Tab) => {
      if (huecoAnterior.current !== hueco) {
        // El efecto de abajo ya no repite esta animación
        ultimoIndiceArrastrado.current = hueco;
        moverPildora(hueco, huecoAnterior.current >= 0);
      }
      requestAnimationFrame(() => onNavigate(tabId));
    },
    [moverPildora, onNavigate],
  );

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
        setAnchoPildora(nuevoAncho);
      }
    },
    [anchoHueco],
  );

  const handleCrearPublicacion = useCallback(() => {
    setPendingTab("create");
    cerrarMenu();
    requestAnimationFrame(() => onNavigate("create"));
  }, [cerrarMenu, onNavigate]);

  const handleTabPressActual = useCallback(
    (tabId: Tab) => {
      if (tabId !== activeTab) {
        setPendingTab(tabId);
        if (menuAbierto) cerrarMenu();
        irAPestana(
          NAV_TABS.findIndex((tab) => tab.id === tabId),
          tabId,
        );
      } else {
        setPendingTab(null);
        if (menuAbierto) cerrarMenu();
      }
    },
    [activeTab, cerrarMenu, irAPestana, menuAbierto],
  );

  const handleCreatePressActual = useCallback(() => {
    if (menuAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  }, [abrirMenu, cerrarMenu, menuAbierto]);

  // Referencias estables: las pestañas (memo) no se vuelven a dibujar cada vez que cambia
  // el estado de la barra, solo cuando cambia lo suyo
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
      ultimoIndiceArrastrado.current = targetIndex;

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
    [activeTab, cerrarMenu, menuAbierto, onNavigate],
  );

  // El gesto llama siempre a la última versión del manejador sin volver a crearse: si se
  // creara de nuevo con cada cambio de estado, un arrastre en curso podía cortarse
  const handleDropRef = useLatestRef(handleDropNavigate);
  const soltarEnHueco = useCallback(
    (hueco: number) => handleDropRef.current(hueco),
    [handleDropRef],
  );

  /** Gesto horizontal para jalar la píldora Liquid Glass por las 4 pestañas y soltarla */
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // A partir de lo que el toque ya no acepta (14): un toque con el dedo un poco movido
        // sigue siendo toque y no se convierte en un arrastre que no navega
        .activeOffsetX([-14, 14])
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

          // Directo, sin crear una animación nueva en cada cuadro del arrastre
          estirar.set(Math.min(Math.abs(e.velocityX) / 2200, 0.18));
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

          scheduleOnRN(soltarEnHueco, objetivo);
        })
        .onFinalize(() => {
          arrastrando.set(withSpring(0, { damping: 24, stiffness: 190 }));
          estirar.set(withSpring(0, { damping: 24, stiffness: 180 }));
        }),
    [
      anchoHueco,
      arrastrando,
      estirar,
      soltarEnHueco,
      indicadorVisible,
      inicioArrastre,
      posicion,
    ],
  );

  /**
   * El toque de las pestañas lo atiende un gesto nativo de la cápsula, no un Pressable dentro
   * de ella: el Pressable competía con el arrastre de la píldora y a veces se perdía el toque
   * (había que tocar varias veces). Con el toque y el arrastre en el mismo sistema, el primero
   * que se reconoce gana y el otro se cancela, así un solo toque siempre navega.
   */
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
      .maxDistance(14)
      .onBegin((e) => {
        presionado.set(huecoEn(e.x));
      })
      // La regla cree que se lee una ref al dibujar: `tocarHueco` solo corre al tocar
      // eslint-disable-next-line react-hooks/refs
      .onEnd((e, exito) => {
        const hueco = huecoEn(e.x);
        if (exito && hueco >= 0) scheduleOnRN(tocarHueco, hueco);
      })
      .onFinalize(() => {
        presionado.set(-1);
      });
    return Gesture.Race(panGesture, toque);
  }, [panGesture, anchoHueco, presionado, tocarHueco]);

  const indicadorStyle = useAnimatedStyle(() => {
    const ancho = anchoHueco.get();
    const lift = arrastrando.get();
    const stretch = estirar.get();

    return {
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

/* -------------------------------------------------------------------------- */
/*  Estilos Liquid Glass                                                      */
/* -------------------------------------------------------------------------- */

/** La sombra suave de los buscadores de cristal (`sombraCristal`), sin brillos internos */
const SOMBRA_CRISTAL = "0 4px 14px rgba(0, 0, 0, 0.08)";

function createStyles(isDark: boolean) {
  // Borde: el del cristal de los buscadores
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
      // Plana (sin sombra ni borde): un gris claro transparente
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
