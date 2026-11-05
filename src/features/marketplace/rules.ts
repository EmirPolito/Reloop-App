import { categoryFor } from "./data";
import type { CategoryId, Product } from "./types";

interface CategoryRule {
  /** Los productos de la categoría se pueden calificar con estrellas. */
  allowsRating: boolean;
  /** Si el formulario pide precio: obligatorio, opcional o no se muestra. */
  price: "required" | "optional" | "none";
}

/** Reglas por categoría en una sola tabla: una categoría nueva solo agrega una fila. */
const CATEGORY_RULES: Record<CategoryId, CategoryRule> = {
  venta: { allowsRating: true, price: "required" },
  comida: { allowsRating: true, price: "required" },
  cambio: { allowsRating: false, price: "optional" },
  donacion: { allowsRating: false, price: "none" },
  mascota: { allowsRating: false, price: "none" },
};

export function allowsProductRating(category: CategoryId): boolean {
  return CATEGORY_RULES[category].allowsRating;
}

export function categoryPriceMode(category: CategoryId): CategoryRule["price"] {
  return CATEGORY_RULES[category].price;
}

/** Promedio de las calificaciones de los productos calificables, o "—" si no hay ninguna. */
export function averageRatingLabel(products: Product[]): string {
  const rated = products.filter(
    (product) =>
      allowsProductRating(product.category) && product.rating !== undefined,
  );
  if (rated.length === 0) return "—";
  const total = rated.reduce((sum, product) => sum + (product.rating ?? 0), 0);
  return (total / rated.length).toFixed(1);
}

/** "Donación", "$120" o `null` cuando el producto no tiene precio. */
export function formatProductPrice(product: Product): string | null {
  if (product.category === "donacion") return "Donación";
  return product.price > 0 ? `$${product.price}` : null;
}

/** Texto de la etiqueta sobre la foto: el precio o, si no tiene, la categoría. */
export function productBadgeLabel(product: Product): string {
  return formatProductPrice(product) ?? categoryFor(product.category).label;
}
