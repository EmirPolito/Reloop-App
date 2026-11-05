import { useEffect, useMemo, useState } from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { useMarketplaceState } from "../MarketplaceProvider";
import { subscribeProduct } from "../productRepository";
import type { Product } from "../types";

const NO_IDS: string[] = [];

/**
 * Publicaciones por id. Las del inicio salen de ahí; las más antiguas que las últimas
 * cargadas (favoritos viejos, un chat de hace meses) se piden una por una, así que no
 * desaparecen aunque el inicio solo traiga las más recientes.
 * `loading` es verdadero mientras falte alguna por responder.
 */
export function useProductsByIds(ids: string[]): {
  products: Product[];
  loading: boolean;
} {
  const { uid } = useSessionUser();
  const { products: feed, status } = useMarketplaceState();
  // `null`: ya se consultó y no existe
  const [fetched, setFetched] = useState<Record<string, Product | null>>({});

  const feedIds = useMemo(() => new Set(feed.map((item) => item.id)), [feed]);
  const missingKey = useMemo(
    () =>
      status === "loading"
        ? ""
        : [...new Set(ids)].filter((id) => !feedIds.has(id)).join("|"),
    [ids, feedIds, status],
  );

  useEffect(() => {
    if (!missingKey) return;
    const unsubscribers = missingKey.split("|").map((id) =>
      subscribeProduct(
        id,
        uid,
        (product) => setFetched((current) => ({ ...current, [id]: product })),
        (error) => {
          console.warn("No se pudo leer la publicación.", describeFirestoreError(error));
          setFetched((current) => ({ ...current, [id]: null }));
        },
      ),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [missingKey, uid]);

  const products = useMemo(() => {
    const byId = new Map(feed.map((item) => [item.id, item]));
    return ids.flatMap((id) => {
      const product = byId.get(id) ?? fetched[id];
      return product ? [product] : [];
    });
  }, [ids, feed, fetched]);

  const loading =
    status === "loading" ||
    (missingKey !== "" && missingKey.split("|").some((id) => !(id in fetched)));

  return { products, loading };
}

/** Una publicación por id (ver `useProductsByIds`). */
export function useProduct(productId: string | undefined): {
  product: Product | undefined;
  loading: boolean;
} {
  const { products, loading } = useProductsByIds(
    productId ? [productId] : NO_IDS,
  );
  return { product: products[0], loading };
}
