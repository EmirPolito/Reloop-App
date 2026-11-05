import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";

/** Filas del inicio: categorías fijas, banner y los productos de dos en dos. */
export type HomeFeedRow =
  | { type: "categories" }
  | { type: "banner" }
  | { type: "products"; products: Product[] }
  | { type: "empty" }
  | { type: "loading" }
  | { type: "error" };

const PRODUCTS_PER_ROW = 2;

export function buildHomeFeedRows(
  products: Product[],
  status: FeedStatus,
): HomeFeedRow[] {
  const rows: HomeFeedRow[] = [{ type: "categories" }, { type: "banner" }];
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

export function homeRowKey(row: HomeFeedRow, index: number): string {
  return row.type === "products"
    ? `products-${row.products[0]?.id ?? index}`
    : row.type;
}
