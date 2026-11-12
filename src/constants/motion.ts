import { Easing } from "react-native-reanimated";

/** Curva de salida usada en las animaciones de la interfaz (igual que HeroUI Native). */
export const EASE_OUT = Easing.out(Easing.ease);

/** Curva de salida más marcada: arranca rápido y frena suave, sin rebote. */
export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);

/** Entrada de un módulo (pestaña o pantalla): fundido con un desplazamiento corto. */
export const ENTRADA_MODULO = {
  desplazamiento: 8,
  timing: { duration: 220, easing: EASE_OUT_CUBIC },
} as const;
