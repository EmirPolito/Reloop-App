import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Alto del contenido del encabezado, sin la zona de safe area (px). */
export const THREAD_HEADER_CONTENT_HEIGHT = 65;

/** Alto de la tarjeta del producto bajo el encabezado (px). */
export const THREAD_PRODUCT_CARD_HEIGHT = 58;

/** Espacio entre lo fijo de arriba y el primer mensaje (px). */
export const THREAD_CONTENT_GAP = 8;

/** Capas: el header siempre por encima de todo lo demás del chat. */
export const THREAD_HEADER_Z = 100;
export const THREAD_PRODUCT_CARD_Z = 90;

/** Alto total del encabezado: safe area + contenido. */
export function useThreadHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + THREAD_HEADER_CONTENT_HEIGHT;
}

/** Alto de lo que queda fijo arriba (encabezado y, si la hay, tarjeta del producto). */
export function threadFixedHeight(
  headerHeight: number,
  hasProductCard: boolean,
): number {
  return headerHeight + (hasProductCard ? THREAD_PRODUCT_CARD_HEIGHT : 0);
}
