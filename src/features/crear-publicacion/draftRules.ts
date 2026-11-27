import {
  allowsProductRating,
  categoryPriceMode,
} from "@/features/marketplace/rules";
import type {
  NewProductData,
  OpcionGuardada,
} from "@/features/marketplace/productRepository";
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

/** Cuántas fotos puede tener una publicación: la grande y 4 chicas (opcionales) */
export const MAX_FOTOS = 5;
/** Cuántos productos puede tener una publicación de venta o comida */
export const MAX_OPCIONES = 10;
/** Largo de la descripción corta de cada producto */
export const LARGO_DESCRIPCION_OPCION = 60;
/** Largo de la ubicación (p. ej. "Edificio B") */
export const LARGO_UBICACION = 40;

/** Un producto de la publicación mientras se escribe (sabor, tamaño...) */
export interface DraftOption {
  /** Clave local, también es el id que se guarda */
  key: string;
  name: string;
  /** Descripción corta, opcional */
  description: string;
  priceText: string;
  /** Cuántos tiene de este producto */
  quantityText: string;
  /** URI local o URL ya subida */
  photo: string | null;
}

export interface ProductDraft {
  name: string;
  description: string;
  priceText: string;
  quantityText: string;
  category: CategoryId;
  /** Hasta 5 fotos (URI local o URL ya subida); la primera es la grande */
  photos: string[];
  /** Venta y comida: los productos que se pueden pedir */
  options: DraftOption[];
  /** Dónde se entrega, opcional */
  ubicacion: string;
}

export const EMPTY_DRAFT: ProductDraft = {
  name: "",
  description: "",
  priceText: "",
  quantityText: "1",
  category: "venta",
  photos: [],
  options: [],
  ubicacion: "",
};

export type DraftValidation =
  | {
      valid: true;
      price: number;
      availableQuantity: number;
      /** Los productos con su precio y cantidad ya leídos (sin fotos subidas) */
      options: {
        id: string;
        nombre: string;
        descripcion: string;
        precio: number;
        disponibles: number;
      }[];
    }
  | { valid: false; title: string; message: string };

/** Un producto nuevo, listo para llenar */
export function nuevaOpcion(): DraftOption {
  return {
    key: `o${Date.now().toString(36)}`,
    name: "",
    description: "",
    priceText: "",
    quantityText: "1",
    photo: null,
  };
}

/** Un producto que se dejó tal como salió (sin nombre, descripción, precio ni foto): no cuenta */
export function opcionVacia(opcion: DraftOption): boolean {
  return (
    !opcion.name.trim() &&
    !opcion.description.trim() &&
    !opcion.priceText.trim() &&
    !opcion.photo
  );
}

/** Los productos solo se guardan en venta y comida */
export function usesOptions(category: CategoryId): boolean {
  return allowsProductRating(category);
}

/** Comprueba el borrador antes de publicar y resuelve el precio final. */
export function validateDraft(draft: ProductDraft): DraftValidation {
  if (!draft.name.trim()) {
    return {
      valid: false,
      title: "Falta el nombre",
      message: "Escribe el nombre de tu publicación para poder publicarla.",
    };
  }

  // Los que se dejaron vacíos (como el de ejemplo sin llenar) no cuentan
  const options = usesOptions(draft.category)
    ? draft.options.filter((opcion) => !opcionVacia(opcion))
    : [];
  const leidas: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    disponibles: number;
  }[] = [];
  for (const option of options) {
    const nombre = option.name.trim();
    const precio = parsePrice(option.priceText);
    if (!nombre) {
      return {
        valid: false,
        title: "Falta un nombre",
        message: "Uno de los productos no tiene nombre. Escríbelo o quítalo.",
      };
    }
    if (precio === null) {
      return {
        valid: false,
        title: "Precio no válido",
        message: 'Escribe el precio de "' + nombre + '".',
      };
    }
    const disponibles = cantidadValida(option.quantityText);
    if (disponibles === null) {
      return {
        valid: false,
        title: "Cantidad no válida",
        message:
          'Escribe cuántas piezas tienes de "' + nombre + '" (de 1 a 9999).',
      };
    }
    leidas.push({
      id: option.key,
      nombre,
      descripcion: option.description.trim().slice(0, LARGO_DESCRIPCION_OPCION),
      precio,
      disponibles,
    });
  }

  const mode = categoryPriceMode(draft.category);
  // Con productos, el precio de la publicación es el del más barato
  const price =
    leidas.length > 0
      ? Math.min(...leidas.map((o) => o.precio))
      : parsePrice(draft.priceText);
  const priceTyped = leidas.length > 0 || draft.priceText.trim().length > 0;
  const priceRequired =
    mode === "required" || (mode === "optional" && priceTyped);

  if (priceRequired && price === null) {
    return {
      valid: false,
      title: "Precio no válido",
      message: "Escribe un precio válido, por ejemplo 150.",
    };
  }

  // Con productos, cada uno lleva su cantidad: la publicación tiene la suma de todos
  const quantity =
    leidas.length > 0
      ? Math.min(
          MAX_CANTIDAD,
          leidas.reduce((s, o) => s + o.disponibles, 0),
        )
      : cantidadValida(draft.quantityText);
  if (quantity === null) {
    return {
      valid: false,
      title: "Cantidad no válida",
      message: "Escribe cuántas piezas tienes, de 1 a 9999.",
    };
  }

  return {
    valid: true,
    price: mode === "none" ? 0 : (price ?? 0),
    availableQuantity: quantity,
    options: leidas,
  };
}

/** Lo más que se puede tener disponible de algo */
const MAX_CANTIDAD = 9999;

/** La cantidad escrita si es un entero entre 1 y 9999; si no, `null` */
function cantidadValida(texto: string): number | null {
  const cantidad = Number(texto.trim());
  return Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= MAX_CANTIDAD
    ? cantidad
    : null;
}

/** Datos que se guardan al publicar; las fotos ya deben estar subidas. */
export function buildNewProduct(
  draft: ProductDraft,
  {
    ownerId,
    seller,
    price,
    availableQuantity,
    imagenes,
    opciones,
  }: {
    ownerId: string;
    seller: string;
    price: number;
    availableQuantity: number;
    imagenes: string[];
    opciones: OpcionGuardada[];
  },
): NewProductData {
  const ubicacion = draft.ubicacion.trim().slice(0, LARGO_UBICACION);
  return {
    ownerId,
    seller,
    name: draft.name.trim(),
    description: draft.description.trim() || "Sin descripción",
    category: draft.category,
    price,
    availableQuantity,
    imageUrl: imagenes[0] ?? null,
    imagenes: imagenes.slice(0, MAX_FOTOS),
    opciones,
    ...(ubicacion ? { ubicacion } : {}),
  };
}
