import { useFocusEffect } from "expo-router";
import { useCallback, type PropsWithChildren } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ENTRADA_MODULO } from "@/constants/motion";

const IS_WEB = Platform.OS === "web";

/**
 * Contenedor de cada pestaña. Al entrar hace un fundido con un desplazamiento corto; todo
 * corre en el hilo de UI con un solo valor compartido, sin renderizar la pestaña de nuevo.
 * Con "Reducir movimiento" activo, Reanimated salta al estado final y no hay animación.
 *
 * En la web, además, oculta la pestaña sin foco (React Navigation la deja dibujada). En iOS y
 * Android no hace falta: react-native-screens ya las desacopla.
 */
export function TabScene({ children }: PropsWithChildren) {
  const progress = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      progress.set(withTiming(1, ENTRADA_MODULO.timing));
      return () => progress.set(0);
    }, [progress]),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p,
      transform: [{ translateY: (1 - p) * ENTRADA_MODULO.desplazamiento }],
      ...(IS_WEB ? { display: p === 0 ? "none" : "flex" } : null),
    };
  });

  return (
    <Animated.View style={[styles.fill, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
