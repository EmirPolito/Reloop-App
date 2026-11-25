/**
 * Pedidos de venta y comida: lo que se elige en la publicación y viaja al chat.
 * Lógica pura (sin React ni Firebase): tiene pruebas en `tests/domain.test.ts`.
 */

export type MetodoPago = "efectivo" | "transferencia";
export const METODOS_PAGO: readonly MetodoPago[] = [
  "efectivo",
  "transferencia",
];

export const LARGO_NOTA = 300;
export const MAX_ITEMS = 10;
/** Tope por producto cuando la publicación no dice cuántos hay de cada uno */
export const MAX_POR_ITEM = 20;

export interface ItemPedido {
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Pedido {
  productoId: string;
  producto: string;
  items: ItemPedido[];
  total: number;
  metodo: MetodoPago;
  /** Lo que escribe quien pide (dónde, cuándo, detalles): obligatorio */
  nota: string;
}

export function totalDe(items: readonly ItemPedido[]): number {
  return items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
}

export function piezasDe(items: readonly ItemPedido[]): number {
  return items.reduce((suma, item) => suma + item.cantidad, 0);
}

/** 1234.5 → "$1,234.50" */
export function formatearDinero(cantidad: number): string {
  return `$${cantidad.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function nombreMetodo(metodo: MetodoPago): string {
  return metodo === "efectivo" ? "Efectivo" : "Transferencia";
}

/** Lo que se ve en la lista de chats y en la notificación */
export function textoPedido(pedido: Pedido): string {
  const piezas = piezasDe(pedido.items);
  return `🧾 Pedido: ${piezas} ${piezas === 1 ? "producto" : "productos"} · ${formatearDinero(pedido.total)}`;
}

/** Qué falta para mandar el pedido; `null` si está listo */
export function faltantePedido(datos: {
  items: readonly ItemPedido[];
  metodo: MetodoPago | null;
  nota: string;
}): string | null {
  if (piezasDe(datos.items) === 0) return "Elige al menos un producto.";
  if (!datos.metodo) return "Elige cómo vas a pagar.";
  if (datos.nota.trim().length === 0)
    return "Escribe la descripción de tu pedido.";
  return null;
}

/** Lo que llega de Firestore como pedido, o `undefined` si no es válido */
export function leerPedido(valor: unknown): Pedido | undefined {
  if (!valor || typeof valor !== "object") return undefined;
  const { productoId, producto, items, total, metodo, nota } = valor as Record<
    string,
    unknown
  >;
  if (
    typeof productoId !== "string" ||
    typeof producto !== "string" ||
    !Array.isArray(items) ||
    typeof total !== "number" ||
    (metodo !== "efectivo" && metodo !== "transferencia") ||
    typeof nota !== "string"
  )
    return undefined;
  const leidos = items.flatMap((item): ItemPedido[] => {
    if (!item || typeof item !== "object") return [];
    const { nombre, precio, cantidad } = item as Record<string, unknown>;
    return typeof nombre === "string" &&
      typeof precio === "number" &&
      typeof cantidad === "number"
      ? [{ nombre, precio, cantidad }]
      : [];
  });
  return { productoId, producto, items: leidos, total, metodo, nota };
}
