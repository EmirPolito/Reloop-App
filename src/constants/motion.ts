import { Easing } from "react-native-reanimated";

/** Curva de salida usada en las animaciones de la interfaz (igual que HeroUI Native). */
export const EASE_OUT = Easing.out(Easing.ease);

/** Curva de salida más marcada: arranca rápido y frena suave, sin rebote. */
export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);

/** Entrada de un módulo (pestaña o pantalla): fundido con un desplazamiento corto. */
export const ENTRADA_MODULO = {
  desplazamiento: 8,
  timing: { duration: 110, easing: EASE_OUT_CUBIC },
} as const;

/**
 * Entrada y salida de los módulos con su propio efecto (búsqueda, favoritos, chats,
 * notificaciones, perfil, conversación...): fundido con un desplazamiento corto, sin rebote.
 * Corta para que entrar y salir se sienta rápido pero suave (antes 350/200 ms se sentía lento).
 */
const CURVA_MODULO = Easing.bezier(0.4, 0, 0.2, 1);
export const TRANSICION_MODULO = {
  desplazamiento: 10,
  entrada: { duration: 220, easing: CURVA_MODULO },
  salida: { duration: 130, easing: CURVA_MODULO },
} as const;
