import { useEffect, useMemo, useState } from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { useMarketplaceState } from "../MarketplaceProvider";
import { subscribeUserProducts } from "../productRepository";
import type { Product } from "../types";
import type { FeedStatus } from "./useMarketplaceData";

const NO_PRODUCTS: Product[] = [];

interface Listing {
  ownerId: string;
  products: Product[];
  status: FeedStatus;
}

/**
 * Publicaciones de una persona (la propia o la de otra), de la más reciente a la más
 * antigua. Mientras llega la consulta completa de esa persona se muestran las suyas que el
 * inicio ya cargó, así el perfil no espera al servidor para enseñar sus publicaciones.
 */
export function useUserProducts(ownerId: string) {
  const { uid } = useSessionUser();
  const { products: feed } = useMarketplaceState();
  const [listing, setListing] = useState<Listing | null>(null);
  const fromFeed = useMemo(
    () => feed.filter((product) => product.ownerId === ownerId),
    [feed, ownerId],
  );

  useEffect(
    () =>
      subscribeUserProducts(
        ownerId,
        uid,
        (products) => setListing({ ownerId, products, status: "ready" }),
        (error) => {
          console.warn(
            "No se pudo leer las publicaciones.",
            describeFirestoreError(error),
          );
          setListing({ ownerId, products: NO_PRODUCTS, status: "error" });
        },
      ),
    [ownerId, uid],
  );

  // Si la persona cambia, lo guardado es de la anterior y se ignora hasta que llegue lo nuevo
  const current = listing?.ownerId === ownerId ? listing : null;
  if (current) return { products: current.products, status: current.status };
  // Sin ninguna en el inicio no se adivina: se espera la consulta (puede tener más antiguas)
  if (fromFeed.length > 0) {
    return { products: fromFeed, status: "ready" as FeedStatus };
  }
  return { products: NO_PRODUCTS, status: "loading" as FeedStatus };
}
