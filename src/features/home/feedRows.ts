import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";

/** Filas del inicio: banner, categorías fijas, título de sección y los productos de dos en dos. */
export type HomeFeedRow =
  | { type: "banner" }
  | { type: "categories" }
  | { type: "sectionTitle" }
  | { type: "products"; products: Product[] }
  /** Modo "@" del buscador: resultados de personas en lugar del feed */
  | { type: "users"; term: string }
  | { type: "empty" }
  | { type: "loading" }
  | { type: "error" };

const PRODUCTS_PER_ROW = 2;

export function buildHomeFeedRows(
  products: Product[],
  status: FeedStatus,
): HomeFeedRow[] {
  const rows: HomeFeedRow[] = [
    { type: "banner" },
    { type: "categories" },
    { type: "sectionTitle" },
  ];
  if (status === "loading") {
    rows.push({ type: "loading" });
    return rows;
  }
  if (products.length === 0) {
    rows.push({ type: status === "error" ? "error" : "empty" });
    return rows;
  }
  for (let index = 0; index < products.length; index += PRODUCTS_PER_ROW) {
    rows.push({
      type: "products",
      products: products.slice(index, index + PRODUCTS_PER_ROW),
    });
  }
  return rows;
}

/** Filas del modo "@": solo los resultados de personas (sin banner ni categorías). */
export function buildUserSearchRows(term: string): HomeFeedRow[] {
  return [{ type: "users", term }];
}

export function homeRowKey(row: HomeFeedRow, index: number): string {
  return row.type === "products"
    ? `products-${row.products[0]?.id ?? index}`
    : row.type;
}
