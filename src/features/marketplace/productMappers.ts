import type { DocumentData, DocumentSnapshot } from "firebase/firestore";

import type { Resena } from "@/features/resenas/formatoResena";
import { toMillis } from "@/lib/firestoreValues";
import { CATEGORIES } from "./data";
import { allowsProductRating } from "./rules";
import type { CategoryId, Product, ProductOption } from "./types";

function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

const MAX_FOTOS = 4;

function textos(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === "string")
    : [];
}

function opciones(valor: unknown): ProductOption[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item, i): ProductOption[] => {
    if (!item || typeof item !== "object") return [];
    const { id, nombre, descripcion, precio, imagenUrl } = item as Record<
      string,
      unknown
    >;
    if (typeof nombre !== "string" || typeof precio !== "number") return [];
    return [
      {
        id: typeof id === "string" ? id : String(i),
        name: nombre,
        description: typeof descripcion === "string" ? descripcion : "",
        price: precio,
        imageUri: typeof imagenUrl === "string" ? imagenUrl : null,
      },
    ];
  });
}

/** Convierte un documento de `productos` en un `Product`; `null` si está mal formado. */
export function mapProduct(
  snapshot: DocumentSnapshot<DocumentData>,
  uid: string,
): Product | null {
  const data = snapshot.data({ serverTimestamps: "estimate" });
  if (!data || !isCategory(data.category) || typeof data.name !== "string") {
    return null;
  }

  // Solo cuentan las reseñas reales (las calificaciones de antes ya no se usan)
  const reviewCount = Math.max(0, Number(data.resenasCount ?? 0));
  const reviewTotal = Number(data.resenasTotal ?? 0);
  const rating =
    allowsProductRating(data.category) && reviewCount > 0
      ? reviewTotal / reviewCount
      : undefined;

  const imageUri = typeof data.imageUrl === "string" ? data.imageUrl : null;
  const guardadas = textos(data.imagenes);
  // Las de antes solo tienen `imageUrl`
  const images = (
    guardadas.length > 0 ? guardadas : imageUri ? [imageUri] : []
  ).slice(0, MAX_FOTOS);

  return {
    id: snapshot.id,
    ownerId: String(data.ownerId ?? ""),
    name: data.name,
    description: typeof data.description === "string" ? data.description : "",
    category: data.category,
    price: Number(data.price ?? 0),
    imageUri: images[0] ?? null,
    images,
    options: opciones(data.opciones),
    seller: typeof data.seller === "string" ? data.seller : "Usuario",
    ...(rating !== undefined ? { rating } : {}),
    reviewCount,
    availableQuantity: Math.max(
      1,
      Math.floor(
        Number.isFinite(Number(data.availableQuantity))
          ? Number(data.availableQuantity)
          : 1,
      ),
    ),
    distance: typeof data.distance === "string" ? data.distance : "0.0 km",
    ...(typeof data.ubicacion === "string" && data.ubicacion.trim()
      ? { ubicacion: data.ubicacion.trim() }
      : {}),
    isMine: data.ownerId === uid,
    createdAt: toMillis(data.creadoEn),
  };
}

/** Una reseña de `productos/{id}/resenas/{autorId}` */
export function mapReview(snapshot: DocumentSnapshot<DocumentData>): Resena {
  const data = snapshot.data({ serverTimestamps: "estimate" }) ?? {};
  const estrellas = Number(data.estrellas ?? 0);
  return {
    autorId: snapshot.id,
    autor: typeof data.autor === "string" ? data.autor : "Usuario",
    estrellas: Math.min(5, Math.max(1, Math.round(estrellas))),
    texto: typeof data.texto === "string" ? data.texto : "",
    creadaEn: toMillis(data.creadoEn),
  };
}
