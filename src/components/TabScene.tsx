import { useFocusEffect } from "expo-router";
import { useCallback, type PropsWithChildren } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { ENTRADA_MODULO, TRANSICION_MODULO } from "@/constants/motion";
import { registrarSalida } from "./salidaModulo";

const IS_WEB = Platform.OS === "web";

/**
 * Contenedor de cada pestaña. Al entrar hace un fundido con un desplazamiento corto; todo
 * corre en el hilo de UI con un solo valor compartido, sin renderizar la pestaña de nuevo.
 * Con "Reducir movimiento" activo, Reanimated salta al estado final y no hay animación.
 *
 * Con `efecto="modulo"` entra y sale como el módulo de búsqueda (con la transición corta de
 * módulo, y con salida animada antes de navegar fuera: ver `conSalida`). Sirve también para
 * pantallas de la pila.
 *
 * En la web, además, oculta la pestaña sin foco (React Navigation la deja dibujada). En iOS y
 * Android no hace falta: react-native-screens ya las desacopla.
 */
export function TabScene({
  children,
  efecto = "pestana",
}: PropsWithChildren<{ efecto?: "pestana" | "modulo" }>) {
  const progress = useSharedValue(0);
  const modulo = efecto === "modulo";
  const desplazamiento = modulo
    ? TRANSICION_MODULO.desplazamiento
    : ENTRADA_MODULO.desplazamiento;

  useFocusEffect(
    useCallback(() => {
      progress.set(
        withTiming(
          1,
          modulo ? TRANSICION_MODULO.entrada : ENTRADA_MODULO.timing,
        ),
      );
      const quitarSalida = modulo
        ? registrarSalida((despues) => {
            progress.set(
              withTiming(0, TRANSICION_MODULO.salida, (terminado) => {
                if (terminado) scheduleOnRN(despues);
              }),
            );
          })
        : undefined;
      return () => {
        quitarSalida?.();
        progress.set(0);
      };
    }, [progress, modulo]),
  );

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p,
      transform: [{ translateY: (1 - p) * desplazamiento }],
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
