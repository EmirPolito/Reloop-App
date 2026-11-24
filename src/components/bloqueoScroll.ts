import { createContext, useContext, useState } from "react";
import {
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
  type ScrollEvent,
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

/**
 * El manejador de scroll de una lista vertical también recibe los eventos de las filas
 * horizontales que tiene dentro (categorías, carruseles). Esos se reconocen porque su
 * contenido es más ancho que la vista o porque se movieron de lado; la lista vertical nunca.
 * Hay que ignorarlos en todos sus eventos (también al empezar y terminar de arrastrar), o la
 * lista cree que se mueve ella.
 */
export function esScrollAnidado(evento: ScrollEvent) {
  "worklet";
  return (
    evento.contentSize.width > evento.layoutMeasurement.width + 1 ||
    evento.contentOffset.x !== 0
  );
}

/**
 * Para una fila horizontal dentro de una lista (las categorías): mientras el dedo la arrastra,
 * la lista que la contiene no se mueve. Sin esto, cualquier movimiento diagonal movía las dos
 * a la vez y la fila temblaba. Al soltar se libera siempre (la inercia ya no mueve la lista),
 * así nunca se queda bloqueada. Sin lista que la contenga, no hace nada.
 */
export function useBloquearListaAlArrastrar() {
  const bloqueo = useContext(BloqueoScrollContext);
  return useAnimatedScrollHandler({
    onBeginDrag: () => {
      bloqueo?.set(1);
    },
    onEndDrag: () => {
      bloqueo?.set(0);
    },
  });
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
