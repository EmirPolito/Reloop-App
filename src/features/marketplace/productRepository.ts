import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { commitInChunks } from "@/lib/firestoreBatch";
import { mapComment, mapProduct } from "./productMappers";
import { allowsProductRating } from "./rules";
import type { CategoryId, Product, ProductComment } from "./types";

const PRODUCTS = "productos";
const USERS = "usuarios";
const REPORTS = "reportes";
const FEED_LIMIT = 200;
const COMMENTS_LIMIT = 200;

type OnError = (error: unknown) => void;

/** Las publicaciones más recientes, en tiempo real. */
export function subscribeProducts(
  uid: string,
  onData: (products: Product[]) => void,
  onError: OnError,
): Unsubscribe {
  const feed = query(
    collection(db, PRODUCTS),
    orderBy("creadoEn", "desc"),
    limit(FEED_LIMIT),
  );
  return onSnapshot(
    feed,
    (snapshot) =>
      onData(
        snapshot.docs
          .map((item) => mapProduct(item, uid))
          .filter((product): product is Product => product !== null),
      ),
    onError,
  );
}

/** Una publicación en tiempo real; `null` si no existe o ya no es visible. */
export function subscribeProduct(
  productId: string,
  uid: string,
  onData: (product: Product | null) => void,
  onError: OnError,
): Unsubscribe {
  return onSnapshot(
    doc(db, PRODUCTS, productId),
    (snapshot) => onData(mapProduct(snapshot, uid)),
    onError,
  );
}

/** Publicaciones de una persona, de la más reciente a la más antigua (se ordena aquí para no pedir un índice). */
export function subscribeUserProducts(
  ownerId: string,
  uid: string,
  onData: (products: Product[]) => void,
  onError: OnError,
): Unsubscribe {
  const owned = query(collection(db, PRODUCTS), where("ownerId", "==", ownerId));
  return onSnapshot(
    owned,
    (snapshot) =>
      onData(
        snapshot.docs
          .map((item) => mapProduct(item, uid))
          .filter((product): product is Product => product !== null)
          .sort((a, b) => b.createdAt - a.createdAt),
      ),
    onError,
  );
}

export interface NewProductData {
  ownerId: string;
  seller: string;
  name: string;
  description: string;
  category: CategoryId;
  price: number;
  /** URL ya subida a Cloudinary */
  imageUrl: string | null;
}

/** Crea la publicación; las categorías con calificación empiezan en 5.0 (un voto de 5). */
export async function createProduct(data: NewProductData): Promise<string> {
  const ref = doc(collection(db, PRODUCTS));
  const rated = allowsProductRating(data.category);
  await setDoc(ref, {
    ...data,
    distance: "0.0 km",
    ratingTotal: rated ? 5 : 0,
    ratingCount: rated ? 1 : 0,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

/** Actualiza el nombre de vendedor en las publicaciones de la persona que aún muestran otro. */
export async function renameSeller(
  ownerId: string,
  seller: string,
): Promise<void> {
  const owned = await getDocs(
    query(collection(db, PRODUCTS), where("ownerId", "==", ownerId)),
  );
  const outdated = owned.docs.filter((item) => item.data().seller !== seller);
  await commitInChunks(outdated, (batch, item) =>
    batch.update(item.ref, { seller }),
  );
}

// ── Favoritos ────────────────────────────────────────────────────────────────

export function subscribeFavorites(
  uid: string,
  onData: (productIds: string[]) => void,
  onError: OnError,
): Unsubscribe {
  return onSnapshot(
    collection(db, USERS, uid, "favoritos"),
    (snapshot) => onData(snapshot.docs.map((item) => item.id)),
    onError,
  );
}

export async function setFavorite(
  uid: string,
  productId: string,
  favorite: boolean,
): Promise<void> {
  const ref = doc(db, USERS, uid, "favoritos", productId);
  if (favorite) await setDoc(ref, { productId, creadoEn: serverTimestamp() });
  else await deleteDoc(ref);
}

// ── Calificaciones ───────────────────────────────────────────────────────────

export function subscribeMyRatings(
  uid: string,
  onData: (ratings: Record<string, number>) => void,
  onError: OnError,
): Unsubscribe {
  return onSnapshot(
    collection(db, USERS, uid, "calificaciones"),
    (snapshot) =>
      onData(
        Object.fromEntries(
          snapshot.docs.map((item) => [item.id, Number(item.data().rating)]),
        ),
      ),
    onError,
  );
}

/**
 * Guarda la calificación de la persona y actualiza el promedio del producto en la
 * misma transacción (las reglas comprueban que ambas cuadren).
 */
export async function rateProduct(
  uid: string,
  productId: string,
  rating: number,
): Promise<void> {
  const productRef = doc(db, PRODUCTS, productId);
  const ratingRef = doc(db, USERS, uid, "calificaciones", productId);
  await runTransaction(db, async (transaction) => {
    const [product, previous] = await Promise.all([
      transaction.get(productRef),
      transaction.get(ratingRef),
    ]);
    if (!product.exists()) throw new Error("La publicación ya no existe.");
    const before = previous.exists() ? Number(previous.data().rating) : 0;
    transaction.update(productRef, {
      ratingTotal: Number(product.data().ratingTotal ?? 0) - before + rating,
      ratingCount: Number(product.data().ratingCount ?? 0) + (before === 0 ? 1 : 0),
    });
    transaction.set(ratingRef, {
      productId,
      rating,
      actualizadoEn: serverTimestamp(),
    });
  });
}

// ── Comentarios ──────────────────────────────────────────────────────────────

export function subscribeComments(
  productId: string,
  onData: (comments: ProductComment[]) => void,
  onError: OnError,
): Unsubscribe {
  const comments = query(
    collection(db, PRODUCTS, productId, "comentarios"),
    orderBy("creadoEn", "asc"),
    limit(COMMENTS_LIMIT),
  );
  return onSnapshot(
    comments,
    (snapshot) => onData(snapshot.docs.map(mapComment)),
    onError,
  );
}

export async function addComment(
  productId: string,
  comment: { authorId: string; author: string; text: string },
): Promise<void> {
  await addDoc(collection(db, PRODUCTS, productId, "comentarios"), {
    ...comment,
    creadoEn: serverTimestamp(),
  });
}

// ── Reportes ─────────────────────────────────────────────────────────────────

/** Ids de las publicaciones que esta persona ya reportó. */
export function subscribeMyReports(
  uid: string,
  onData: (productIds: string[]) => void,
  onError: OnError,
): Unsubscribe {
  const mine = query(collection(db, REPORTS), where("reporterId", "==", uid));
  return onSnapshot(
    mine,
    (snapshot) => onData(snapshot.docs.map((item) => String(item.data().productId))),
    onError,
  );
}

export async function reportProduct(
  uid: string,
  productId: string,
): Promise<void> {
  await setDoc(doc(db, REPORTS, `${uid}_${productId}`), {
    productId,
    reporterId: uid,
    creadoEn: serverTimestamp(),
  });
}
