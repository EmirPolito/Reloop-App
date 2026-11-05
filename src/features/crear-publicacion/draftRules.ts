import { categoryPriceMode } from "@/features/marketplace/rules";
import type { NewProductData } from "@/features/marketplace/productRepository";
import type { CategoryId } from "@/features/marketplace/types";
import { parsePrice } from "@/utils/price";

export interface ProductDraft {
  name: string;
  description: string;
  priceText: string;
  category: CategoryId;
  photo: string | null;
}

export const EMPTY_DRAFT: ProductDraft = {
  name: "",
  description: "",
  priceText: "",
  category: "venta",
  photo: null,
};

export type DraftValidation =
  | { valid: true; price: number }
  | { valid: false; title: string; message: string };

/** Comprueba el borrador antes de publicar y resuelve el precio final. */
export function validateDraft(draft: ProductDraft): DraftValidation {
  if (!draft.name.trim()) {
    return {
      valid: false,
      title: "Falta el nombre",
      message: "Escribe el nombre del producto antes de publicar.",
    };
  }

  const mode = categoryPriceMode(draft.category);
  const price = parsePrice(draft.priceText);
  const priceTyped = draft.priceText.trim().length > 0;
  const priceRequired = mode === "required" || (mode === "optional" && priceTyped);

  if (priceRequired && price === null) {
    return {
      valid: false,
      title: "Precio no válido",
      message: "Ingresa un precio igual o mayor a cero.",
    };
  }

  return { valid: true, price: mode === "none" ? 0 : (price ?? 0) };
}

/** Datos que se guardan al publicar; la foto ya debe estar subida (`imageUrl`). */
export function buildNewProduct(
  draft: ProductDraft,
  {
    ownerId,
    seller,
    price,
    imageUrl,
  }: { ownerId: string; seller: string; price: number; imageUrl: string | null },
): NewProductData {
  return {
    ownerId,
    seller,
    name: draft.name.trim(),
    description: draft.description.trim() || "Sin descripción",
    category: draft.category,
    price,
    imageUrl,
  };
}
