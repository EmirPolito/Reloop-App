import { categoryPriceMode } from "@/features/marketplace/rules";
import type { NewProductData } from "@/features/marketplace/productRepository";
import type { CategoryId } from "@/features/marketplace/types";
import { parsePrice } from "@/utils/price";

/** Texto corto de cada categoría en el selector del formulario (crear y editar). */
export const FORM_CATEGORY_LABELS: Record<CategoryId, string> = {
  venta: "Vender",
  cambio: "Cambiar",
  donacion: "Donar",
  mascota: "Adopción",
  comida: "Comida",
};

export interface ProductDraft {
  name: string;
  description: string;
  priceText: string;
  quantityText: string;
  category: CategoryId;
  photo: string | null;
}

export const EMPTY_DRAFT: ProductDraft = {
  name: "",
  description: "",
  priceText: "",
  quantityText: "1",
  category: "venta",
  photo: null,
};

export type DraftValidation =
  | { valid: true; price: number; availableQuantity: number }
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

  const quantity = Number(draft.quantityText.trim());
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 9999
  ) {
    return {
      valid: false,
      title: "Cantidad no válida",
      message: "Indica una cantidad entre 1 y 9999.",
    };
  }

  return {
    valid: true,
    price: mode === "none" ? 0 : (price ?? 0),
    availableQuantity: quantity,
  };
}

/** Datos que se guardan al publicar; la foto ya debe estar subida (`imageUrl`). */
export function buildNewProduct(
  draft: ProductDraft,
  {
    ownerId,
    seller,
    price,
    availableQuantity,
    imageUrl,
  }: {
    ownerId: string;
    seller: string;
    price: number;
    availableQuantity: number;
    imageUrl: string | null;
  },
): NewProductData {
  return {
    ownerId,
    seller,
    name: draft.name.trim(),
    description: draft.description.trim() || "Sin descripción",
    category: draft.category,
    price,
    availableQuantity,
    imageUrl,
  };
}
