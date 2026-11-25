import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { commitInChunks } from "@/lib/firestoreBatch";
import { mapProduct } from "./productMappers";
import type { CategoryId, Product } from "./types";

const PRODUCTS = "productos";
const USERS = "usuarios";
const REPORTS = "reportes";
const FEED_LIMIT = 200;

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
  const owned = query(
    collection(db, PRODUCTS),
    where("ownerId", "==", ownerId),
  );
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
  availableQuantity: number;
  /** URL ya subida a Cloudinary (la primera de `imagenes`) */
  imageUrl: string | null;
  /** Todas las fotos, ya subidas (hasta 4) */
  imagenes: string[];
  /** Venta y comida: los productos que se pueden pedir, con su foto ya subida */
  opciones: OpcionGuardada[];
}

/** Un producto de la publicación como se guarda en Firestore */
export interface OpcionGuardada {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string | null;
}

/** Crea la publicación; empieza sin reseñas (las estrellas salen solo de reseñas reales). */
export async function createProduct(data: NewProductData): Promise<string> {
  const ref = doc(collection(db, PRODUCTS));
  await setDoc(ref, {
    ...data,
    distance: "0.0 km",
    resenasTotal: 0,
    resenasCount: 0,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

/** Cambios que la dueña puede hacer a su publicación (ver `validOwnerEdit` en las reglas). */
export interface ProductEdits {
  name: string;
  description: string;
  category: CategoryId;
  price: number;
  availableQuantity: number;
  /** URL ya subida a Cloudinary (la primera de `imagenes`) */
  imageUrl: string | null;
  imagenes: string[];
}

/** Guarda la edición de una publicación propia (las reseñas no se tocan). */
export async function updateProduct(
  productId: string,
  edits: ProductEdits,
): Promise<void> {
  await updateDoc(doc(db, PRODUCTS, productId), { ...edits });
}

/** Republica: renueva la fecha de creación, así vuelve a salir al principio del inicio. */
export async function republishProduct(productId: string): Promise<void> {
  await updateDoc(doc(db, PRODUCTS, productId), {
    creadoEn: serverTimestamp(),
  });
}

/** Borra una publicación propia. */
export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS, productId));
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

/** Quita varios favoritos en un solo lote (una sola actualización de la lista) */
export async function removeFavorites(
  uid: string,
  productIds: string[],
): Promise<void> {
  await commitInChunks(productIds, (batch, productId) =>
    batch.delete(doc(db, USERS, uid, "favoritos", productId)),
  );
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
    (snapshot) =>
      onData(snapshot.docs.map((item) => String(item.data().productId))),
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
