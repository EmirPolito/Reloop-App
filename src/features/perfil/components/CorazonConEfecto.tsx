import { useDissolve } from "dissolve-ui";
import * as Haptics from "expo-haptics";
import { useState, type ComponentRef, type RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  IconoCorazon,
  IconoCorazonRelleno,
} from "@/features/home/components/IconosTarjeta";

/** Chispas alrededor del corazón al darle like y sus colores */
const CHISPAS = 10;
const PALETA = ["#FF2D55", "#FF9F0A", "#5E5CE6", "#34C759", "#64D2FF"];

function Chispa({
  i,
  size,
  p,
  color,
}: {
  i: number;
  size: number;
  p: SharedValue<number>;
  color: string;
}) {
  const angulo = (i / CHISPAS) * Math.PI * 2 - Math.PI / 2;
  const estilo = useAnimatedStyle(() => {
    const v = p.get();
    const r = size * 0.35 + v * size * 0.75;
    return {
      opacity: v === 0 ? 0 : 1 - v,
      transform: [
        { translateX: Math.cos(angulo) * r },
        { translateY: Math.sin(angulo) * r },
        { scale: 1 - v * 0.6 },
      ],
    };
  });
  const d = Math.max(4, size * 0.16);
  return (
    <Animated.View
      style={[
        styles.chispa,
        { width: d, height: d, borderRadius: d / 2, backgroundColor: color },
        estilo,
      ]}
    />
  );
}

/**
 * Corazón con el efecto del LikeButton de dissolve: al activarlo brinca y salen chispas
 * alrededor; al desactivarlo el corazón relleno se deshace en granos y vuelve el contorno.
 */
export function CorazonConEfecto({
  activo,
  onCambio,
  size = 21,
  color,
  colorInactivo,
  accessibilityLabel,
}: {
  activo: boolean;
  onCambio: (activo: boolean) => void;
  size?: number;
  /** Color del corazón relleno */
  color: string;
  /** Color del contorno */
  colorInactivo: string;
  accessibilityLabel: string;
}) {
  const { ref, dissolving, dissolve, reset } = useDissolve();
  const escala = useSharedValue(1);
  const chispas = useSharedValue(0);
  const [ocupado, setOcupado] = useState(false);
  const estiloBrinco = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  const presionar = async () => {
    if (ocupado) return;
    if (!activo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCambio(true);
      escala.set(
        withSequence(
          withTiming(0.86, { duration: 70 }),
          withSpring(1, { damping: 30, stiffness: 500 }),
        ),
      );
      chispas.set(0);
      chispas.set(
        withTiming(
          1,
          { duration: 560, easing: Easing.out(Easing.cubic) },
          () => {
            chispas.set(0);
          },
        ),
      );
      return;
    }
    setOcupado(true);
    await dissolve({
      preset: "snap",
      origin: { x: size / 2, y: size / 2 },
      duration: 800,
      grain: Math.max(1.5, size / 14),
      haptics: true,
    });
    onCambio(false);
    reset();
    setOcupado(false);
  };

  return (
    <Pressable
      onPress={presionar}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={accessibilityLabel}
      style={styles.boton}
    >
      <View style={[styles.centro, { width: size, height: size }]}>
        {Array.from({ length: CHISPAS }, (_, i) => (
          <Chispa
            key={i}
            i={i}
            size={size}
            p={chispas}
            color={PALETA[i % PALETA.length]}
          />
        ))}
        <Animated.View style={estiloBrinco}>
          {activo ? (
            <View
              ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
              collapsable={false}
              style={{ opacity: dissolving ? 0 : 1 }}
            >
              <IconoCorazonRelleno size={size} color={color} />
            </View>
          ) : (
            <IconoCorazon size={size} color={colorInactivo} />
          )}
        </Animated.View>
        {/* Mientras el relleno se deshace, el contorno ya se ve debajo */}
        {activo && dissolving ? (
          <View
            style={[StyleSheet.absoluteFill, styles.centro]}
            pointerEvents="none"
          >
            <IconoCorazon size={size} color={colorInactivo} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: { alignItems: "center", justifyContent: "center" },
  chispa: { position: "absolute" },
});
