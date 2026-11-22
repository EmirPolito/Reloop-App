import { useFocusEffect } from "expo-router";
import { useCallback, type PropsWithChildren } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  ENTRADA_MODULO,
  TRANSICION_MODULO,
  TRANSICION_MODULO_RAPIDA,
} from "@/constants/motion";
import { registrarSalida, tomarEntradaRapida } from "./salidaModulo";

const IS_WEB = Platform.OS === "web";

/**
 * Contenedor de cada pestaña. Al entrar hace un fundido con un desplazamiento corto; todo
 * corre en el hilo de UI con un solo valor compartido, sin renderizar la pestaña de nuevo.
 * Con "Reducir movimiento" activo, Reanimated salta al estado final y no hay animación.
 *
 * Con `efecto="modulo"` entra y sale como el módulo de búsqueda (más despacio, y con salida
 * animada antes de navegar fuera: ver `conSalida`). Sirve también para pantallas de la pila.
 *
 * En la web, además, oculta la pestaña sin foco (React Navigation la deja dibujada). En iOS y
 * Android no hace falta: react-native-screens ya las desacopla.
 */
export function TabScene({
  children,
  efecto = "pestana",
}: PropsWithChildren<{
  /** "moduloRapido": como "modulo", con la transición corta (el buscador de chats) */
  efecto?: "pestana" | "modulo" | "moduloRapido";
}>) {
  const progress = useSharedValue(0);
  const modulo = efecto !== "pestana";
  const transicion =
    efecto === "moduloRapido" ? TRANSICION_MODULO_RAPIDA : TRANSICION_MODULO;
  const desplazamiento = modulo
    ? transicion.desplazamiento
    : ENTRADA_MODULO.desplazamiento;

  useFocusEffect(
    useCallback(() => {
      progress.set(
        withTiming(
          1,
          !modulo
            ? ENTRADA_MODULO.timing
            : // Tras una salida corta (el buscador de chats), la entrada también es corta
              tomarEntradaRapida()
              ? TRANSICION_MODULO_RAPIDA.entrada
              : transicion.entrada,
        ),
      );
      const quitarSalida = modulo
        ? registrarSalida((despues, rapida) => {
            const salida = rapida
              ? TRANSICION_MODULO_RAPIDA.salida
              : transicion.salida;
            progress.set(
              withTiming(0, salida, (terminado) => {
                if (terminado) scheduleOnRN(despues);
              }),
            );
          })
        : undefined;
      return () => {
        quitarSalida?.();
        progress.set(0);
      };
    }, [progress, modulo, transicion]),
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
