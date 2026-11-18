import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Circle, G, Path, Svg } from "react-native-svg";

import { IconoNotificacionLinea, IconoLunaLinea } from "../Perfiliconos";

/** Misma curva con rebote del toggle original (cubic-bezier(0.68, -0.55, 0.265, 1.55)) */
const REBOTE = Easing.bezier(0.68, -0.55, 0.265, 1.55);

// Medidas del tamaño "md" del original: pista 56x32, borde 2, bolita 24 a 2 px del borde
const ANCHO = 56;
const ALTO = 32;
const BORDE = 2;
const BOLITA = 24;
const MARGEN = 2;
const RECORRIDO = ANCHO - BORDE * 2 - BOLITA - MARGEN * 2;
const ICONO = 16;

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}

/** Progreso 0→1 animado con rebote; el valor puede pasarse de 1 un instante, como en el original */
function useProgreso(value: boolean, duracion: number) {
  const progreso = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    progreso.value = withTiming(value ? 1 : 0, {
      duration: duracion,
      easing: REBOTE,
    });
  }, [value, duracion, progreso]);
  return progreso;
}

/** Pista + bolita comunes: los colores y el contenido de la bolita los pone cada toggle */
function ToggleBase({
  value,
  onValueChange,
  accessibilityLabel,
  progreso,
  pista,
  borde,
  bolita,
  children,
}: ToggleProps & {
  progreso: SharedValue<number>;
  /** [apagado, encendido] */
  pista: [string, string];
  borde: [string, string];
  bolita: [string, string];
  children: ReactNode;
}) {
  const estiloPista = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.value, [0, 1], pista),
    borderColor: interpolateColor(progreso.value, [0, 1], borde),
  }));
  const estiloBolita = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.value, [0, 1], bolita),
    transform: [{ translateX: progreso.value * RECORRIDO }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
    >
      <Animated.View style={[styles.pista, estiloPista]}>
        <Animated.View style={[styles.bolita, estiloBolita]}>
          {children}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Capa que apila los iconos en el centro de la bolita */
function CapaIcono({
  style,
  children,
}: {
  style: ReturnType<typeof useAnimatedStyle>;
  children: ReactNode;
}) {
  return (
    <Animated.View style={[styles.capaIcono, style]}>{children}</Animated.View>
  );
}

/** Sol relleno con rayos, igual que el ThemeSunIcon del original */
function SolRelleno({ color }: { color: string }) {
  return (
    <Svg width={ICONO} height={ICONO} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.25} fill={color} />
      <G stroke={color} strokeWidth={2} strokeLinecap="round">
        <Path d="M12 2.5v2.5M12 19v2.5M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2.5 12h2.5M19 12h2.5M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
      </G>
    </Svg>
  );
}

/**
 * Toggle de modo claro/oscuro: pista amanecer → noche, la bolita se desliza y el sol
 * gira y se encoge mientras aparece la luna (port del ThemeToggle web, tamaño md).
 */
export function ToggleTema({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  const progreso = useProgreso(value, 700);

  const estiloSol = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      { rotate: `${interpolate(progreso.value, [0, 1], [0, 90])}deg` },
      { scale: interpolate(progreso.value, [0, 1], [1, 0.5], Extrapolation.CLAMP) },
    ],
  }));
  const estiloLuna = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { rotate: `${interpolate(progreso.value, [0, 1], [-90, 0])}deg` },
      { scale: interpolate(progreso.value, [0, 1], [0.5, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <ToggleBase
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      progreso={progreso}
      pista={["#fef3c7", "#1a1838"]}
      borde={["#e8d5b7", "#2d2a4e"]}
      bolita={["#ff9500", "#e8e6f0"]}
    >
      <CapaIcono style={estiloSol}>
        <SolRelleno color="#FFFFFF" />
      </CapaIcono>
      <CapaIcono style={estiloLuna}>
        <IconoLunaLinea size={ICONO} color="#1a1838" />
      </CapaIcono>
    </ToggleBase>
  );
}

/**
 * Toggle de notificaciones: misma estructura, pero pista gris → violeta y la campana
 * se "sacude" (en vez de girar) al activarse; el color de la campana cruza de gris a violeta.
 */
export function ToggleNotificaciones({
  value,
  onValueChange,
  accessibilityLabel,
  isDark,
}: ToggleProps & { isDark: boolean }) {
  const progreso = useProgreso(value, 600);

  // Balanceo de campana: 0 → -22° → 16° → 0 (en los extremos queda recta)
  const balanceo = (p: number) => {
    "worklet";
    return interpolate(p, [0, 0.35, 0.7, 1], [0, 22, -16, 0], Extrapolation.CLAMP);
  };
  const estiloApagada = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [{ rotate: `${balanceo(progreso.value)}deg` }],
  }));
  const estiloEncendida = useAnimatedStyle(() => ({
    opacity: interpolate(progreso.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ rotate: `${balanceo(progreso.value)}deg` }],
  }));

  return (
    <ToggleBase
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      progreso={progreso}
      pista={isDark ? ["#2a2a30", "#4628bc"] : ["#E5E7EB", "#c9bcff"]}
      borde={isDark ? ["#3d3d46", "#5b3fd6"] : ["#d1d5db", "#8567ff"]}
      bolita={["#FFFFFF", "#FFFFFF"]}
    >
      <CapaIcono style={estiloApagada}>
        <IconoNotificacionLinea size={ICONO + 2} color="#9CA3AF" />
      </CapaIcono>
      <CapaIcono style={estiloEncendida}>
        <IconoNotificacionLinea size={ICONO + 2} color="#6a4fe0" />
      </CapaIcono>
    </ToggleBase>
  );
}

const styles = StyleSheet.create({
  pista: {
    width: ANCHO,
    height: ALTO,
    borderRadius: ALTO / 2,
    borderWidth: BORDE,
    justifyContent: "center",
  },
  bolita: {
    position: "absolute",
    left: MARGEN,
    top: (ALTO - BORDE * 2 - BOLITA) / 2,
    width: BOLITA,
    height: BOLITA,
    borderRadius: BOLITA / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  capaIcono: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
