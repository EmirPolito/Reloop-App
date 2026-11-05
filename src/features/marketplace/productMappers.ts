import type { DocumentData, DocumentSnapshot } from "firebase/firestore";

import { toMillis } from "@/lib/firestoreValues";
import { CATEGORIES } from "./data";
import { allowsProductRating } from "./rules";
import type { CategoryId, Product, ProductComment } from "./types";

function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
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

  const ratingCount = Number(data.ratingCount ?? 0);
  const ratingTotal = Number(data.ratingTotal ?? 0);
  const rating =
    allowsProductRating(data.category) && ratingCount > 0
      ? ratingTotal / ratingCount
      : undefined;

  return {
    id: snapshot.id,
    ownerId: String(data.ownerId ?? ""),
    name: data.name,
    description: typeof data.description === "string" ? data.description : "",
    category: data.category,
    price: Number(data.price ?? 0),
    imageUri: typeof data.imageUrl === "string" ? data.imageUrl : null,
    seller: typeof data.seller === "string" ? data.seller : "Usuario",
    ...(rating !== undefined ? { rating } : {}),
    distance: typeof data.distance === "string" ? data.distance : "0.0 km",
    isMine: data.ownerId === uid,
    createdAt: toMillis(data.creadoEn),
  };
}

export function mapComment(
  snapshot: DocumentSnapshot<DocumentData>,
): ProductComment {
  const data = snapshot.data({ serverTimestamps: "estimate" }) ?? {};
  return {
    id: snapshot.id,
    authorId: String(data.authorId ?? ""),
    author: typeof data.author === "string" ? data.author : "Usuario",
    text: typeof data.text === "string" ? data.text : "",
    createdAt: toMillis(data.creadoEn),
  };
}
