import { categoryFor } from "./data";
import type { CategoryId, Product } from "./types";

export interface FeedFilters {
  query: string;
  category: CategoryId | null;
}

export type FiltersAction =
  | { type: "queryChanged"; query: string }
  | { type: "categoryToggled"; category: CategoryId }
  | { type: "categoryCleared" }
  | { type: "filtersCleared" };

export const NO_FILTERS: FeedFilters = { query: "", category: null };

export function filtersReducer(
  filters: FeedFilters,
  action: FiltersAction,
): FeedFilters {
  switch (action.type) {
    case "queryChanged":
      return { ...filters, query: action.query };

    case "categoryToggled":
      return {
        ...filters,
        category: filters.category === action.category ? null : action.category,
      };

    case "categoryCleared":
      return filters.category === null ? filters : { ...filters, category: null };

    case "filtersCleared":
      return filters.query === "" && filters.category === null
        ? filters
        : NO_FILTERS;
  }
}

/**
 * Productos que coinciden con la categoría activa y con el texto buscado (título,
 * descripción, vendedor y categoría). Un texto que empieza con "@" busca personas, no
 * productos, así que no filtra el feed.
 */
export function filterProducts(
  products: Product[],
  { query, category }: FeedFilters,
): Product[] {
  const trimmed = query.trim();
  const normalizedQuery = trimmed.startsWith("@")
    ? ""
    : trimmed.toLocaleLowerCase();
  return products.filter((product) => {
    if (category && product.category !== category) return false;
    return (
      !normalizedQuery ||
      `${product.name} ${product.description} ${product.seller} ${categoryFor(product.category).label}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    );
  });
}
