import { BlurView } from "expo-blur";
import type { PropsWithChildren } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Alto del buscador del inicio (el del módulo de búsqueda mide lo mismo) */
export const ALTO_PILDORA = 50;
/** Lupa de los buscadores de cristal: un poco más rellena que la de serie */
export const GROSOR_LUPA = 0.5;

/** Si se desenfoca lo de detrás (en Android no) */
export const CON_DESENFOQUE = Platform.OS !== "android";

/**
 * Colores del cristal (buscadores, píldoras y botones redondos de arriba). En Android no hay
 * desenfoque, así que el fondo es más opaco para conservar la legibilidad. En oscuro el borde
 * es apenas visible.
 */
export function coloresCristal(isDark: boolean) {
  return {
    fondo: isDark
      ? "rgba(255,255,255,0.08)"
      : CON_DESENFOQUE
        ? "rgba(255,255,255,0.62)"
        : "rgba(255,255,255,0.8)",
    borde: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.75)",
  };
}

/**
 * El color con el que se ve el buscador: cristal al 62 % sobre la neblina casi sólida. Lo que
 * no tiene la neblina detrás (las píldoras, donde ya se desvanece, y la barra de navegación)
 * usa este tono casi opaco para verse igual y no transparentarse.
 */
export function fondoCristalVisto(isDark: boolean) {
  return isDark ? "rgba(41, 41, 41, 0.94)" : "rgba(253, 253, 253, 0.94)";
}

/** Sombra suave del cristal; va en una capa por fuera del recorte */
export const sombraCristal = {
  shadowColor: "#000000",
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
} as const;

/**
 * Cáscara de cristal del buscador: píldora translúcida y desenfocada con un borde de luz y
 * una sombra suave. La sombra va en una capa por fuera porque `overflow: hidden` (necesario
 * para recortar el desenfoque) la cortaría.
 */
export function PildoraCristal({
  style,
  contentStyle,
  relleno,
  opaco = false,
  children,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  /** Estilo de la píldora por dentro (p. ej., sin padding para el botón redondo) */
  contentStyle?: StyleProp<ViewStyle>;
  /** Fondo sólido en lugar del cristal (una píldora elegida, un botón de peligro) */
  relleno?: string;
  /** Con el tono casi opaco con el que se ve el buscador (ver `fondoCristalVisto`) */
  opaco?: boolean;
}>) {
  const { isDark } = useAppTheme();
  const colores = coloresCristal(isDark);

  return (
    <View style={[styles.sombra, style]}>
      <View
        style={[
          styles.pildora,
          {
            backgroundColor:
              relleno ?? (opaco ? fondoCristalVisto(isDark) : colores.fondo),
            borderColor: relleno ?? colores.borde,
          },
          contentStyle,
        ]}
      >
        {CON_DESENFOQUE && !relleno ? (
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sombra: { borderRadius: 999, ...sombraCristal },
  pildora: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: ALTO_PILDORA,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
});
