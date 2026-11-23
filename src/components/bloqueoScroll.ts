import { createContext, useContext, useState } from "react";
import {
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { PausaBrilloContext } from "@/components/ui/PremiumBadge";

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

/**
 * `true` mientras la pantalla se desplaza (ver `PausaBrilloContext`): para detener lo que
 * rota con un intervalo (frases, banners). Solo cambia al empezar y al terminar, nunca por
 * cuadro. Sin pantalla que lo dé, nunca pausa.
 */
export function useEnPausa(): boolean {
  const pausa = useContext(PausaBrilloContext);
  const [enPausa, setEnPausa] = useState(false);
  useAnimatedReaction(
    () => (pausa ? pausa.get() : 0),
    (actual, anterior) => {
      if (actual !== anterior) scheduleOnRN(setEnPausa, actual === 1);
    },
  );
  return enPausa;
}
