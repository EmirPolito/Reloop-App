import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, PanResponder } from "react-native";

const AUTO_ADVANCE_MS = 4500;
const FADE_OUT = { opacity: 0.2, scale: 0.94, duration: 160 };
const FADE_IN = { opacity: 1, scale: 1, duration: 240 };
/** Arrastre horizontal mínimo para cambiar de diapositiva (px). */
const SWIPE_DISTANCE = 40;

function transition(
  fade: Animated.Value,
  scale: Animated.Value,
  { opacity, scale: scaleTo, duration }: typeof FADE_OUT,
) {
  return Animated.parallel([
    Animated.timing(fade, { toValue: opacity, duration, useNativeDriver: true }),
    Animated.timing(scale, { toValue: scaleTo, duration, useNativeDriver: true }),
  ]);
}

/**
 * Carrusel de las pantallas de acceso: cambio con desvanecido, avance automático
 * (en pausa mientras el usuario escribe) y gesto de deslizar.
 */
export function useAuthCarousel(slideCount: number, paused: boolean) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const [scale] = useState(() => new Animated.Value(1));

  const goToSlide = useCallback(
    (index: number) => {
      if (index === activeSlide) return;
      // Un cambio nuevo interrumpe el que esté en curso
      fade.stopAnimation();
      scale.stopAnimation();
      transition(fade, scale, FADE_OUT).start(({ finished }) => {
        if (!finished) return;
        setActiveSlide(index);
        transition(fade, scale, FADE_IN).start();
      });
    },
    [activeSlide, fade, scale],
  );

  /** Avanza (+1) o retrocede (-1) con vuelta al principio/final. */
  const goBy = useCallback(
    (step: number) => goToSlide((activeSlide + step + slideCount) % slideCount),
    [goToSlide, activeSlide, slideCount],
  );

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => goBy(1), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, goBy]);

  useEffect(
    () => () => {
      fade.stopAnimation();
      scale.stopAnimation();
    },
    [fade, scale],
  );

  // Se recrea cuando cambia la diapositiva para que el gesto siempre vea la actual
  const panHandlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dy) < 30,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_DISTANCE) goBy(-1);
          else if (gesture.dx < -SWIPE_DISTANCE) goBy(1);
        },
      }).panHandlers,
    [goBy],
  );

  return { activeSlide, goToSlide, fade, scale, panHandlers };
}
