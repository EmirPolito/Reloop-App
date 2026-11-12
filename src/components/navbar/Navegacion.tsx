import { PressableSuave } from "@/components/PressableSuave";
import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/routes";
import {
  IconoAnuncios,
  IconoPublicaciones,
} from "@/features/perfil/Perfiliconos";
import { Text } from "@/features/shared/Text";
import type { IconName } from "@/features/shared/constants";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  Keyframe,
  type SharedValue,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface NavegacionProps {
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  isDark?: boolean;
  hasUnreadChats?: boolean;
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

/* -------------------------------------------------------------------------- */
/*  Animaciones (todo corre en el hilo de UI con Reanimated)                  */
/* -------------------------------------------------------------------------- */

const FLEX_NORMAL = 1;
const FLEX_SELECTED = 1.42;
const FLEX_FAV_SELECTED = 1.62;
const FLEX_EASING = Easing.out(Easing.cubic);
const FLEX_DUR = 200;

/** El texto entra y sale ágilmente sin demoras artificiales */
const LABEL_ENTERING = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 4 }] },
  100: {
    opacity: 1,
    transform: [{ translateX: 0 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(160);

const LABEL_EXITING = new Keyframe({
  0: { opacity: 1, transform: [{ translateX: 0 }] },
  100: {
    opacity: 0,
    transform: [{ translateX: 4 }],
    easing: Easing.in(Easing.quad),
  },
}).duration(90);

const TabButton = React.memo(function TabButton({
  tab,
  selected,
  isDark,
  showChatBadge,
  onPress,
  styles,
}: {
  tab: NavTabItem;
  selected: boolean;
  isDark: boolean;
  showChatBadge: boolean;
  onPress: (tab: Tab) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const isFavorite = tab.id === "favorites";
  const extraFlex =
    (isFavorite ? FLEX_FAV_SELECTED : FLEX_SELECTED) - FLEX_NORMAL;

  // Un único valor compartido (0 → 1) mueve todo: ancho, pill e iconos
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: FLEX_DUR,
      easing: FLEX_EASING,
    });
  }, [selected, progress]);

  const wrapperStyle = useAnimatedStyle(() => ({
    flex: FLEX_NORMAL + extraFlex * progress.value,
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.83],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const iconSelectedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.67],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const iconUnselectedStyle = useAnimatedStyle(() => ({
    opacity:
      1 - interpolate(progress.value, [0, 0.67], [0, 1], Extrapolation.CLAMP),
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isFavorite ? 1.5 * progress.value : 0 }],
  }));

  const selectedIconColor = isDark ? "#FFFFFF" : "#1a1a1aff";
  const unselectedIconColor = isDark ? "#8A8994" : "#9a9a9aff";

  return (
    <Animated.View style={[styles.tabButtonWrapper, wrapperStyle]}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={tab.label}
        onPress={() => onPress(tab.id)}
        style={styles.tabButton}
      >
        <Animated.View
          style={[styles.tabButtonPill, pillStyle]}
          pointerEvents="none"
        />

        <View style={styles.tabContent}>
          <Animated.View style={[styles.tabIconWrap, iconWrapStyle]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.iconCenter,
                iconUnselectedStyle,
              ]}
              pointerEvents="none"
            >
              <NavigationIcon
                name={tab.icon}
                selected={false}
                size={21}
                color={unselectedIconColor}
              />
            </Animated.View>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.iconCenter,
                iconSelectedStyle,
              ]}
              pointerEvents="none"
            >
              <NavigationIcon
                name={tab.icon}
                selected={true}
                size={21}
                color={selectedIconColor}
              />
            </Animated.View>
            {tab.id === "chats" && showChatBadge && (
              <View style={styles.tabBadge} />
            )}
          </Animated.View>

          {selected && (
            <Animated.View
              // En web Reanimated deja el contenedor en position:absolute tras animarlo y el icono pisa el texto
              entering={Platform.OS === "web" ? undefined : LABEL_ENTERING}
              exiting={Platform.OS === "web" ? undefined : LABEL_EXITING}
              style={styles.textContainer}
            >
              <Text numberOfLines={1} style={styles.tabLabelSelected}>
                {tab.label}
              </Text>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

/** Menú de crear: abre rápido y frena suave; cierra más corto */
const MENU_ABRIR = { duration: 240, easing: Easing.bezier(0.23, 1, 0.32, 1) };
const MENU_CERRAR = { duration: 160, easing: Easing.out(Easing.cubic) };
const MENU_BLUR = 30;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/** Color del icono de cada opción del menú */
const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

const CreateButton = React.memo(function CreateButton({
  onPress,
  label,
  styles,
}: {
  onPress: () => void;
  label: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const pressScale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.createWrap, scaleStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          pressScale.set(withTiming(1, { duration: 60 }));
        }}
        onPressOut={() => {
          pressScale.set(withTiming(1, { duration: 100 }));
        }}
        onPress={onPress}
      >
        <View
          className="bg-gradient-to-br from-black/95 to-black/85 h-[54px] w-[54px] items-center justify-center rounded-full border border-white/30"
          style={{
            shadowColor: "#2a2a2aff",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <NavigationIcon name="add" size={25} color="#FFFFFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
});

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
  styles: ReturnType<typeof createStyles>;
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
        <CreateButton onPress={onClose} label="Cerrar" styles={styles} />
      </View>

      <Animated.View
        style={[styles.menuCrear, { bottom: bottom + 64 }, opcionesStyle]}
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
  const showChatBadge = hasUnreadChats;
  const bottomInset = Platform.OS === "web" ? 16 : Math.max(insets.bottom, 12);

  const handleTabPress = useCallback(
    (tabId: Tab) => {
      if (tabId === activeTab) return;
      onNavigate(tabId);
    },
    [activeTab, onNavigate],
  );

  const [menuVisible, setMenuVisible] = useState(false);
  const menu = useSharedValue(0);

  const abrirMenu = useCallback(() => {
    setMenuVisible(true);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  // El modal se desmonta cuando termina la animación de salida
  const cerrarMenu = useCallback(() => {
    menu.set(withTiming(0, MENU_CERRAR));
    setTimeout(() => setMenuVisible(false), MENU_CERRAR.duration);
  }, [menu]);

  const handleCrearPublicacion = useCallback(() => {
    cerrarMenu();
    onNavigate("create");
  }, [cerrarMenu, onNavigate]);

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.navigationRow, { bottom: bottomInset }]}
    >
      <View style={styles.navigation}>
        {NAV_TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            selected={activeTab === tab.id}
            isDark={isDark}
            showChatBadge={showChatBadge}
            onPress={handleTabPress}
            styles={styles}
          />
        ))}
      </View>

      <CreateButton
        onPress={abrirMenu}
        label="Publicar producto"
        styles={styles}
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
/*  Estilos (sin cambios)                                                     */
/* -------------------------------------------------------------------------- */

function createStyles(isDark: boolean) {
  const colors = isDark
    ? {
        glass: "rgba(30, 30, 34, 0.95)",
        outerBorder: "rgba(255, 255, 255, 0.12)",
        selectedPill: "rgba(255, 255, 255, 0.15)",
        pillBorder: "rgba(255, 255, 255, 0.18)",
        text: "#FFFFFF",
        velo:
          Platform.OS === "android"
            ? "rgba(16, 16, 18, 0.94)"
            : "rgba(16, 16, 18, 0.8)",
      }
    : {
        glass: "rgba(241, 241, 241, 1)",
        outerBorder: "#ffffff",
        selectedPill: "#FFFFFF",
        pillBorder: "#ffffffff",
        text: "#101010",
        velo:
          Platform.OS === "android"
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
      gap: 5,
      backgroundColor: "transparent",
      zIndex: 999,
    },

    navigation: {
      flex: 1,
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      borderRadius: 30,
      backgroundColor: colors.glass,
      borderWidth: 2,
      borderColor: colors.outerBorder,
      elevation: 0.1,
    },

    tabButtonWrapper: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    tabButton: {
      width: "99%",
      height: 42.5,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 30,
    },

    tabButtonPill: {
      ...StyleSheet.absoluteFill,
      borderRadius: 30,
      backgroundColor: colors.selectedPill,
      borderWidth: 1,
      borderColor: colors.pillBorder,
    },

    iconCenter: {
      alignItems: "center",
      justifyContent: "center",
    },

    tabContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    tabIconWrap: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },

    textContainer: {
      marginLeft: 3,
      justifyContent: "center",
      overflow: "hidden",
    },

    tabLabelSelected: {
      color: colors.text,
      fontSize: 11,
      fontWeight: "600",
    },

    createWrap: {
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
      right: 30,
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

    tabBadge: {
      position: "absolute",
      top: -1,
      right: -2,
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: "#FF3366",
      borderWidth: 1,
      borderColor: colors.glass,
    },
  });
}

export default Navegacion;
