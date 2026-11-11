import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/routes";
import { ESTILO_BOTON_ACCION } from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import type { IconName } from "@/features/shared/constants";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  Keyframe,
  interpolate,
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

const CreateButton = React.memo(function CreateButton({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const botonTema = ESTILO_BOTON_ACCION;
  const pressScale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.createWrap, scaleStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Publicar producto"
        onPressIn={() => {
          pressScale.set(withTiming(0.92, { duration: 60 }));
        }}
        onPressOut={() => {
          pressScale.set(withTiming(1, { duration: 100 }));
        }}
        onPress={onPress}
      >
        <LinearGradient
          colors={botonTema.colors}
          locations={[0, 0.54, 1]}
          style={[
            styles.createButton,
            {
              borderColor: botonTema.borderColor,
              shadowColor: botonTema.shadowColor,
            },
          ]}
        >
          {/* Reflejo superior Glossy */}
          <LinearGradient
            colors={["#ffffff5d", "#ffffff17"]}
            style={styles.glossyOverlay}
          />

          <NavigationIcon name="add" size={25} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

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

  const handleCreatePress = useCallback(() => {
    onNavigate("create");
  }, [onNavigate]);

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

      <CreateButton onPress={handleCreatePress} styles={styles} />
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
      }
    : {
        glass: "rgba(255, 255, 255, 0.9)",
        outerBorder: "#ffffff",
        selectedPill: "#FFFFFF",
        pillBorder: "#ffffffff",
        text: "#101010",
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

    createButton: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      borderColor: "#7dbaffff",
      shadowColor: "#2563EB",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
      overflow: "hidden",
    },

    glossyOverlay: {
      position: "absolute",
      top: 0,
      left: 2,
      right: 2,
      height: 25,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
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
