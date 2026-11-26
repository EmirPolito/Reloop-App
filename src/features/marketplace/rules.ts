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

/** Cuánto dura una publicación: 24 horas desde que se publicó (o se republicó) */
export const DURACION_PUBLICACION_MS = 24 * 60 * 60 * 1000;

/** Si ya pasaron sus 24 horas: los demás ya no la ven (la dueña sí, para republicarla) */
export function publicacionVencida(createdAt: number, now: number): boolean {
  return createdAt > 0 && now - createdAt >= DURACION_PUBLICACION_MS;
}

/** "Hace un momento", "Hace 5 min", "Hace 3 h" (o "Hace 2 días" si ya venció) */
export function formatPublicationTime(createdAt: number, now: number): string {
  const minutos = Math.floor(Math.max(0, now - createdAt) / 60_000);
  if (!createdAt || minutos < 1) return "Hace un momento";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "Hace 1 día" : `Hace ${dias} días`;
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
