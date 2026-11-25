import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Alto del contenido del encabezado, sin la zona de safe area (px). */
export const THREAD_HEADER_CONTENT_HEIGHT = 65;

/** Espacio entre lo fijo de arriba y el primer mensaje (px). */
export const THREAD_CONTENT_GAP = 8;

/** Capas: el header siempre por encima de todo lo demás del chat. */
export const THREAD_HEADER_Z = 100;

/** Alto total del encabezado: safe area + contenido. */
export function useThreadHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + THREAD_HEADER_CONTENT_HEIGHT;
}
