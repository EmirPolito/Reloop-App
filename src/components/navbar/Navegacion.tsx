import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/routes";
import { unreadBadgeLabel } from "@/features/notificaciones/notificationRules";
import {
  IconoAnuncios,
  IconoCampana,
  IconoCampanaLinea,
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
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export interface NavegacionProps {
  /** `null` en pantallas fuera de las pestañas: ningún icono queda marcado */
  activeTab: Tab | null;
  onNavigate: (tab: Tab) => void;
  onOpenNotifications: () => void;
  /** En la pantalla de notificaciones: la campana queda marcada (rellena y con el indicador) */
  notificacionesActivas?: boolean;
  isDark?: boolean;
  hasUnreadChats?: boolean;
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

/** Lugares de la cápsula: las pestañas y la campana */
const HUECOS = NAV_TABS.length + 1;

/** Hueco que ocupa la campana: entre Chats y Perfil */
const HUECO_CAMPANA = 3;

/** Hueco de la cápsula en el que va cada pestaña (las que van tras la campana se corren uno) */
const huecoDeTab = (indice: number) =>
  indice >= HUECO_CAMPANA ? indice + 1 : indice;

const ALTO_CAPSULA = 62;
/** Espacio entre el borde de la cápsula y el indicador */
const MARGEN_CAPSULA = 5;
const TAMANO_ICONO = 23;

/** Iconos de contorno de las pestañas sin seleccionar */
const ICONOS_LINEA: Record<
  Tab,
  ((props: { size?: number; color?: string }) => React.JSX.Element) | undefined
> = {
  home: IconoInicioLinea,
  favorites: IconoFavoritoLinea,
  chats: IconoChatLinea,
  profile: IconoPerfilLinea,
} as Record<Tab, any>;

/* -------------------------------------------------------------------------- */
/*  Animaciones (todo corre en el hilo de UI con Reanimated)                  */
/* -------------------------------------------------------------------------- */

/** El indicador arranca rápido y frena suave, sin rebote */
const DESLIZAR = { duration: 280, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const APARECER = { duration: 160, easing: Easing.out(Easing.cubic) };

/** Menú de crear: abre rápido y frena suave; cierra más corto */
const MENU_ABRIR = { duration: 240, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const MENU_CERRAR = { duration: 160, easing: Easing.out(Easing.cubic) };
const MENU_BLUR = 30;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/** Color del icono de cada opción del menú */
const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

type Estilos = ReturnType<typeof createStyles>;

/**
 * Fondo de cristal de la cápsula y del botón de crear. En iOS y web desenfoca lo que hay
 * detrás; en Android el desenfoque no está activo en la app y lo suple un tinte más opaco,
 * con el mismo borde y la misma sombra.
 */
function Cristal({ isDark, styles }: { isDark: boolean; styles: Estilos }) {
  return (
    <>
      {Platform.OS !== "android" && (
        <BlurView
          intensity={40}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, styles.cristalTinte]} />
    </>
  );
}

/**
 * Pestaña de la cápsula: solo el icono. Sin seleccionar se dibuja de contorno; el activo,
 * relleno. Ambos se funden según lo cerca que esté el indicador, así el cambio acompaña al
 * deslizamiento sin estado propio.
 */
function TabButton({
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
  const iconSelectedStyle = useAnimatedStyle(() => ({
    opacity:
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
      indicadorVisible.get(),
  }));
  const iconUnselectedStyle = useAnimatedStyle(() => ({
    opacity:
      1 -
      Math.max(0, 1 - Math.abs(posicion.get() - indice)) *
        indicadorVisible.get(),
  }));

  const colorInactivo = isDark ? "#A1A1AA" : "#1A1A1A";
  const colorActivo = isDark ? "#FFFFFF" : "#1A1A1A";
  const IconoLinea = ICONOS_LINEA[tab.id];

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.label}
      onPress={() => onPress(tab.id)}
      scaleTo={0.88}
      style={styles.hueco}
    >
      <View style={styles.icono}>
        <Animated.View style={[styles.iconoCapa, iconUnselectedStyle]}>
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
        <Animated.View style={[styles.iconoCapa, iconSelectedStyle]}>
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
    </PressableScale>
  );
}

/**
 * Campana de la cápsula: abre las notificaciones y muestra cuántas hay sin leer.
 * De contorno normalmente (rellena si hay sin leer). En la pantalla de notificaciones se
 * marca como una pestaña más: el indicador se desliza detrás y el icono pasa a relleno.
 */
function BellButton({
  unread,
  selected,
  posicion,
  indicadorVisible,
  isDark,
  onPress,
  styles,
}: {
  unread: number;
  selected: boolean;
  posicion: SharedValue<number>;
  indicadorVisible: SharedValue<number>;
  isDark: boolean;
  onPress: () => void;
  styles: Estilos;
}) {
  const colorInactivo = isDark ? "#A1A1AA" : "#1A1A1A";
  const colorActivo = isDark ? "#FFFFFF" : "#1A1A1A";
  const iconSelectedStyle = useAnimatedStyle(() => ({
    opacity:
      Math.max(0, 1 - Math.abs(posicion.get() - HUECO_CAMPANA)) *
      indicadorVisible.get(),
  }));
  const iconUnselectedStyle = useAnimatedStyle(() => ({
    opacity:
      1 -
      Math.max(0, 1 - Math.abs(posicion.get() - HUECO_CAMPANA)) *
        indicadorVisible.get(),
  }));
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={
        unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"
      }
      onPress={onPress}
      scaleTo={0.88}
      style={styles.hueco}
    >
      <View style={styles.icono}>
        <Animated.View style={[styles.iconoCapa, iconUnselectedStyle]}>
          {unread > 0 ? (
            <IconoCampana size={TAMANO_ICONO} color={colorActivo} />
          ) : (
            <IconoCampanaLinea size={TAMANO_ICONO} color={colorInactivo} />
          )}
        </Animated.View>
        <Animated.View style={[styles.iconoCapa, iconSelectedStyle]}>
          <IconoCampana size={TAMANO_ICONO} color={colorActivo} />
        </Animated.View>
        {unread > 0 ? (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{unreadBadgeLabel(unread)}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

/** Botón circular de la acción principal, con el mismo cristal que la cápsula */
function CreateButton({
  onPress,
  label,
  isDark,
  styles,
  sinSombra = false,
}: {
  onPress: () => void;
  label: string;
  isDark: boolean;
  styles: Estilos;
  sinSombra?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.97}
      style={sinSombra ? styles.sinSombra : styles.sombra}
    >
      <View style={styles.crear}>
        <Cristal isDark={isDark} styles={styles} />
        <View>
          <NavigationIcon
            name="add"
            size={26}
            color={isDark ? "#FFFFFF" : "#1A1A1A"}
          />
        </View>
      </View>
    </PressableScale>
  );
}

/** Opciones que salen del botón de crear, sobre el contenido difuminado */
function MenuCrear({
  menu,
  isDark,
  bottom,
  onClose,
  onAnuncio,
  onPublicacion,
  styles,
}: {
  menu: SharedValue<number>;
  isDark: boolean;
  bottom: number;
  onClose: () => void;
  onAnuncio: () => void;
  onPublicacion: () => void;
  styles: Estilos;
}) {
  const blurProps = useAnimatedProps(() => ({
    intensity: MENU_BLUR * menu.value,
  }));

  const veloStyle = useAnimatedStyle(() => ({ opacity: menu.value }));

  // Crece desde la esquina del botón (transformOrigin en styles.menuCrear)
  const opcionesStyle = useAnimatedStyle(() => ({
    opacity: menu.value,
    transform: [{ scale: 0.2 + 0.8 * menu.value }],
  }));

  const opciones = [
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
  ];

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/* En Android el desenfoque no está activo en la app: lo suple un velo más opaco */}
      {Platform.OS !== "android" && (
        <AnimatedBlurView
          animatedProps={blurProps}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.menuVelo, veloStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      {/* El botón sigue a la vista, encima del velo, y cierra el menú */}
      <View style={[styles.menuBoton, { bottom }]}>
        <CreateButton
          onPress={onClose}
          label="Cerrar"
          isDark={isDark}
          styles={styles}
          sinSombra
        />
      </View>

      <Animated.View
        style={[
          styles.menuCrear,
          { bottom: bottom + ALTO_CAPSULA + 10 },
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

/**
 * Barra de navegación flotante: una cápsula de cristal con los iconos de las pestañas y la
 * campana, y a su derecha el botón circular de crear. Un indicador se desliza detrás del
 * icono de la pestaña activa.
 */
export function Navegacion({
  activeTab,
  onNavigate,
  onOpenNotifications,
  notificacionesActivas = false,
  isDark = false,
  hasUnreadChats = false,
  unreadNotifications = 0,
}: NavegacionProps) {
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);

  // -1 en "create" o fuera de las pestañas: no hay icono marcado y el indicador se oculta
  const indiceTab = NAV_TABS.findIndex((tab) => tab.id === activeTab);
  const huecoActivo = notificacionesActivas
    ? HUECO_CAMPANA
    : indiceTab >= 0
      ? huecoDeTab(indiceTab)
      : -1;
  const posicion = useSharedValue(Math.max(huecoActivo, 0));
  const indicadorVisible = useSharedValue(huecoActivo >= 0 ? 1 : 0);
  const anchoHueco = useSharedValue(0);

  // Con "Reducir movimiento", Reanimated lleva el indicador a su sitio sin animar
  useEffect(() => {
    if (huecoActivo >= 0) posicion.set(withTiming(huecoActivo, DESLIZAR));
    indicadorVisible.set(withTiming(huecoActivo >= 0 ? 1 : 0, APARECER));
  }, [huecoActivo, posicion, indicadorVisible]);

  const medirCapsula = (e: LayoutChangeEvent) => {
    anchoHueco.set((e.nativeEvent.layout.width - MARGEN_CAPSULA * 2) / HUECOS);
  };

  const indicadorStyle = useAnimatedStyle(() => ({
    width: anchoHueco.get(),
    opacity: anchoHueco.get() > 0 ? indicadorVisible.get() : 0,
    transform: [{ translateX: posicion.get() * anchoHueco.get() }],
  }));

  const handleTabPress = (tabId: Tab) => {
    if (tabId !== activeTab) onNavigate(tabId);
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const menu = useSharedValue(0);

  const abrirMenu = () => {
    setMenuVisible(true);
    menu.set(withTiming(1, MENU_ABRIR));
  };

  // El modal se desmonta cuando termina la animación de salida
  const cerrarMenu = () => {
    menu.set(
      withTiming(0, MENU_CERRAR, () => {
        scheduleOnRN(setMenuVisible, false);
      }),
    );
  };

  const handleCrearPublicacion = () => {
    cerrarMenu();
    onNavigate("create");
  };

  return (
    <View style={[styles.navigationRow, { bottom: bottomInset }]}>
      <View style={[styles.sombra, styles.capsulaSombra]}>
        <View
          accessibilityRole="tablist"
          onLayout={medirCapsula}
          style={styles.capsula}
        >
          <Cristal isDark={isDark} styles={styles} />
          <Animated.View
            pointerEvents="none"
            style={[styles.indicador, indicadorStyle]}
          />
          {NAV_TABS.map((tab, indice) => (
            <Fragment key={tab.id}>
              {indice === HUECO_CAMPANA && (
                <BellButton
                  unread={unreadNotifications}
                  selected={notificacionesActivas}
                  posicion={posicion}
                  indicadorVisible={indicadorVisible}
                  isDark={isDark}
                  onPress={onOpenNotifications}
                  styles={styles}
                />
              )}
              <TabButton
                tab={tab}
                indice={huecoDeTab(indice)}
                selected={!notificacionesActivas && activeTab === tab.id}
                posicion={posicion}
                indicadorVisible={indicadorVisible}
                showBadge={tab.id === "chats" && hasUnreadChats}
                isDark={isDark}
                onPress={handleTabPress}
                styles={styles}
              />
            </Fragment>
          ))}
        </View>
      </View>

      <CreateButton
        onPress={abrirMenu}
        label="Publicar producto"
        isDark={isDark}
        styles={styles}
        sinSombra={menuVisible}
      />

      {menuVisible && (
        <MenuCrear
          menu={menu}
          isDark={isDark}
          bottom={bottomInset}
          onClose={cerrarMenu}
          // Todavía no existe el flujo de crear anuncio: por ahora solo cierra el menú
          onAnuncio={cerrarMenu}
          onPublicacion={handleCrearPublicacion}
          styles={styles}
        />
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Estilos                                                                   */
/* -------------------------------------------------------------------------- */

function createStyles(isDark: boolean) {
  const android = Platform.OS === "android";
  const colors = isDark
    ? {
        cristal: android ? "rgba(34, 34, 38, 0.96)" : "rgba(34, 34, 38, 0.62)",
        borde: "rgba(255, 255, 255, 0.14)",
        indicador: "rgba(255, 255, 255, 0.16)",
        sombra: "0 8px 24px rgba(0, 0, 0, 0.35)",
        sombraIndicador: "0 1px 4px rgba(0, 0, 0, 0.25)",
        fondoContador: "#222226",
        text: "#FFFFFF",
        velo: android ? "rgba(16, 16, 18, 0.94)" : "rgba(16, 16, 18, 0.8)",
      }
    : {
        cristal: android ? "#f8f8f8ff" : "#f8f8f8ff",
        borde: "#ffffffff",
        indicador: "#ffffffff",
        sombra: "0 8px 24px rgba(0, 0, 0, 0.1)",
        sombraIndicador: "0 1px 4px rgba(0, 0, 0, 0.08)",
        fondoContador: "#EBEBEF",
        text: "#101010",
        velo: android
          ? "rgba(255, 255, 255, 0.94)"
          : "rgba(255, 255, 255, 0.8)",
      };

  return StyleSheet.create({
    navigationRow: {
      position: "absolute",
      left: 15,
      right: 15,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      zIndex: 999,
    },

    /** La sombra va en una vista aparte: la cápsula recorta su contenido (overflow) */
    sombra: {
      borderRadius: ALTO_CAPSULA / 2,
      boxShadow: colors.sombra,
    },
    sinSombra: {
      borderRadius: ALTO_CAPSULA / 2,
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
      overflow: "hidden",
    },

    cristalTinte: { backgroundColor: colors.cristal },

    indicador: {
      position: "absolute",
      left: MARGEN_CAPSULA,
      top: MARGEN_CAPSULA - 1,
      bottom: MARGEN_CAPSULA - 1,
      borderRadius: ALTO_CAPSULA / 2,
      backgroundColor: colors.indicador,
      boxShadow: colors.sombraIndicador,
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

    iconoCapa: {
      ...StyleSheet.absoluteFill,
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

    contador: {
      position: "absolute",
      top: -6,
      right: -8,
      minWidth: 17,
      height: 17,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: "#FF3366",
      borderWidth: 1.5,
      borderColor: colors.fondoContador,
      alignItems: "center",
      justifyContent: "center",
    },

    contadorTexto: { color: "#FFFFFF", fontSize: 9.5, fontWeight: "700" },

    crear: {
      width: ALTO_CAPSULA,
      height: ALTO_CAPSULA,
      borderRadius: ALTO_CAPSULA / 2,
      borderWidth: 1,
      borderColor: colors.borde,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },

    /** Misma posición que el botón de la barra (navigationRow deja 15 a la derecha) */
    menuBoton: {
      position: "absolute",
      right: 15,
    },

    menuVelo: {
      backgroundColor: colors.velo,
    },

    /** Alineado a la derecha, con los iconos sobre el eje del botón de crear */
    menuCrear: {
      position: "absolute",
      right: 33,
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
