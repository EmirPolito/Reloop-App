import type { Product } from "./types";

/** Con tantas publicaciones de la misma persona (en la lista que se ve) o más, se agrupan en su tarjeta */
export const MIN_PARA_TARJETA = 3;

/** Una tarjeta de vendedor, o hasta dos publicaciones sueltas lado a lado */
export type BloqueVendedor =
  | { type: "seller"; ownerId: string; products: Product[] }
  | { type: "products"; products: Product[] };

const POR_FILA = 2;

/**
 * Acomoda una lista de publicaciones en bloques: quien tiene insignia (Premium, en
 * `conInsignia`) y `MIN_PARA_TARJETA` o más publicaciones sale en una sola tarjeta (en el
 * lugar de su primera publicación) y el resto, de dos en dos, como antes. No cambia el orden
 * en que aparece cada persona o publicación.
 */
export function agruparPorVendedor(
  products: Product[],
  conInsignia: ReadonlySet<string>,
): BloqueVendedor[] {
  const porDueno = new Map<string, Product[]>();
  for (const product of products) {
    const lista = porDueno.get(product.ownerId);
    if (lista) lista.push(product);
    else porDueno.set(product.ownerId, [product]);
  }

  const bloques: BloqueVendedor[] = [];
  let sueltas: Product[] = [];
  const vaciarSueltas = () => {
    for (let i = 0; i < sueltas.length; i += POR_FILA) {
      bloques.push({
        type: "products",
        products: sueltas.slice(i, i + POR_FILA),
      });
    }
    sueltas = [];
  };

  const emitidos = new Set<string>();
  for (const product of products) {
    const suyas = porDueno.get(product.ownerId) ?? [];
    if (suyas.length < MIN_PARA_TARJETA || !conInsignia.has(product.ownerId)) {
      sueltas.push(product);
    } else if (!emitidos.has(product.ownerId)) {
      emitidos.add(product.ownerId);
      vaciarSueltas();
      bloques.push({
        type: "seller",
        ownerId: product.ownerId,
        products: suyas,
      });
    }
  }
  vaciarSueltas();
  return bloques;
}
