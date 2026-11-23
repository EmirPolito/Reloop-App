import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import { agruparPorVendedor } from "@/features/marketplace/sellerGroups";
import type { Product } from "@/features/marketplace/types";

/** Filas del inicio: banner, categorías fijas, título de sección y los productos de dos en dos. */
export type HomeFeedRow =
  | { type: "banner" }
  | { type: "categories" }
  /** `count`: publicaciones mostradas (`null` mientras cargan) */
  | { type: "sectionTitle"; count: number | null }
  | { type: "products"; products: Product[] }
  /** Quien tiene insignia y 3 o más publicaciones a la vista: todas en su tarjeta */
  | { type: "seller"; ownerId: string; products: Product[] }
  /** Modo "@" del buscador: resultados de personas en lugar del feed */
  | { type: "users"; term: string }
  | { type: "empty" }
  | { type: "loading" }
  | { type: "error" };

export function buildHomeFeedRows(
  products: Product[],
  status: FeedStatus,
  /** Quienes tienen insignia (Premium): solo ellos salen en tarjeta grande */
  conInsignia: ReadonlySet<string>,
): HomeFeedRow[] {
  const rows: HomeFeedRow[] = [
    { type: "banner" },
    { type: "categories" },
    {
      type: "sectionTitle",
      count: status === "loading" ? null : products.length,
    },
  ];
  if (status === "loading") {
    rows.push({ type: "loading" });
    return rows;
  }
  if (products.length === 0) {
    rows.push({ type: status === "error" ? "error" : "empty" });
    return rows;
  }
  rows.push(...agruparPorVendedor(products, conInsignia));
  return rows;
}

/** Filas del modo "@": solo los resultados de personas (sin banner ni categorías). */
export function buildUserSearchRows(term: string): HomeFeedRow[] {
  return [{ type: "users", term }];
}

export function homeRowKey(row: HomeFeedRow, index: number): string {
  if (row.type === "products")
    return `products-${row.products[0]?.id ?? index}`;
  if (row.type === "seller") return `seller-${row.ownerId}`;
  return row.type;
}
