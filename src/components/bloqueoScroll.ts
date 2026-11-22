import { createContext, useContext } from "react";
import {
  useAnimatedProps,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

/**
 * Mientras un carrusel horizontal se arrastra (1), la lista vertical que lo contiene no se
 * mueve: así el dedo mueve una sola cosa y las fotos no tiemblan por el vaivén vertical. Todo
 * en el hilo de UI (sin renders).
 */
export const BloqueoScrollContext = createContext<SharedValue<number> | null>(
  null,
);

/** Para la lista vertical: el valor a compartir y las props que la bloquean */
export function useBloqueoScroll() {
  const bloqueo = useSharedValue(0);
  const propsBloqueo = useAnimatedProps(() => ({
    scrollEnabled: bloqueo.get() === 0,
  }));
  return { bloqueo, propsBloqueo };
}

/** Para el carrusel: el valor de la lista que lo contiene (o null si no hay) */
export function useBloqueoDeLista() {
  return useContext(BloqueoScrollContext);
}
