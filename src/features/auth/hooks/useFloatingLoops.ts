import { useEffect, useState } from "react";
import { Animated } from "react-native";

/** Vaivén vertical continuo: sube `distance`, baja `distance` (el doble de lento) y vuelve al centro. */
function useFloatLoop(distance: number, duration: number): Animated.Value {
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const timing = (toValue: number, ms: number) =>
      Animated.timing(offset, { toValue, duration: ms, useNativeDriver: true });
    const loop = Animated.loop(
      Animated.sequence([
        timing(-distance, duration),
        timing(distance, duration * 2),
        timing(0, duration),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [offset, distance, duration]);

  return offset;
}

/** Desfases de las tres imágenes flotantes: cada una con ritmo propio para que no vayan sincronizadas. */
export function useFloatingLoops() {
  return {
    center: useFloatLoop(8, 2200),
    left: useFloatLoop(6, 1900),
    right: useFloatLoop(7, 2500),
  };
}
