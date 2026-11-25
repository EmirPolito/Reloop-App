import { memo, type ComponentType } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/rutas";
import {
  IconoChatLinea,
  IconoFavoritoLinea,
  IconoInicioLinea,
  IconoPerfil,
  IconoPerfilLinea,
} from "@/features/perfil/iconosPerfil";
import type { IconName } from "@/features/shared/constants";
import { TAMANO_ICONO, type Estilos } from "./estilos";

interface Pestana {
  id: Tab;
  label: string;
  icon: IconName;
}

/** Las pestañas de la cápsula, en orden */
export const PESTANAS: Pestana[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "favorites", label: "Favoritos", icon: "favorite" },
  { id: "chats", label: "Chats", icon: "chat" },
  { id: "profile", label: "Perfil", icon: "person" },
];
export const TOTAL_PESTANAS = PESTANAS.length;
export const ULTIMA_PESTANA = TOTAL_PESTANAS - 1;

/** Icono de línea de cada pestaña cuando no está activa */
const ICONOS_LINEA: Partial<
  Record<Tab, ComponentType<{ size?: number; color?: string }>>
> = {
  home: IconoInicioLinea,
  favorites: IconoFavoritoLinea,
  chats: IconoChatLinea,
  profile: IconoPerfilLinea,
};

const ACCION_ACTIVAR = [{ name: "activate" as const }];

/**
 * Una pestaña de la cápsula. No recibe toques: los gestos de la cápsula deciden cuál se tocó.
 * El icono relleno aparece a medida que la píldora llega a su hueco.
 */
export const BotonPestana = memo(function BotonPestana({
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
  tab: Pestana;
  indice: number;
  selected: boolean;
  /** Dónde está la píldora (en huecos, con decimales mientras se mueve) */
  posicion: SharedValue<number>;
  indicadorVisible: SharedValue<number>;
  showBadge: boolean;
  isDark: boolean;
  /** Solo para lectores de pantalla */
  onPress: (tab: Tab) => void;
  /** El hueco que se está presionando (-1 si ninguno) */
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
  const colorActivo = isDark ? "#11a8ffff" : "#11a8ffff";
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
