/** Alto del encabezado del chat (px): lo que cubre antes de que empiece el contenido. */
export const THREAD_HEADER_HEIGHT = 88;

/** Alto de la tarjeta del producto bajo el encabezado, con su margen (px). */
const THREAD_PRODUCT_CARD_HEIGHT = 58;

/** Espacio entre lo fijo de arriba y el primer mensaje (px). */
export const THREAD_CONTENT_GAP = 8;

/**
 * Alto de lo que queda fijo arriba (encabezado y, si la hay, tarjeta del producto).
 * La lista de mensajes empieza justo debajo, así ningún mensaje se mete bajo ellos.
 */
export function threadFixedHeight(hasProductCard: boolean): number {
  return THREAD_HEADER_HEIGHT + (hasProductCard ? THREAD_PRODUCT_CARD_HEIGHT : 0);
}
