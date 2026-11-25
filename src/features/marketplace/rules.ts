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

/**
 * Valoración de una persona: el promedio de todas las reseñas de sus publicaciones de venta
 * y comida (cada reseña pesa igual, sin importar de qué publicación sea). "0" si no hay.
 */
export function averageRatingLabel(products: Product[]): string {
  let estrellas = 0;
  let resenas = 0;
  for (const product of products) {
    if (!allowsProductRating(product.category) || product.rating === undefined)
      continue;
    estrellas += product.rating * product.reviewCount;
    resenas += product.reviewCount;
  }
  return resenas === 0 ? "0" : (estrellas / resenas).toFixed(1);
}

/** "Donación", "$120" o `null` cuando el producto no tiene precio. */
export function formatProductPrice(product: Product): string | null {
  if (product.category === "donacion") return "Donación";
  if (product.price <= 0) return null;
  const amount = product.price.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${amount} MXN`;
}

/** Texto de la etiqueta sobre la foto: el precio o, si no tiene, la categoría. */
export function productBadgeLabel(product: Product): string {
  return formatProductPrice(product) ?? categoryFor(product.category).label;
}
