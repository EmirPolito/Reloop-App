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
 * notificaciones y perfil): fundido con un desplazamiento corto, sin rebote. Entra despacio
 * para que no se sienta brusco y sale más rápido para que cerrar se sienta inmediato.
 */
const CURVA_MODULO = Easing.bezier(0.4, 0, 0.2, 1);
export const TRANSICION_MODULO = {
  desplazamiento: 12,
  entrada: { duration: 350, easing: CURVA_MODULO },
  salida: { duration: 200, easing: CURVA_MODULO },
} as const;
