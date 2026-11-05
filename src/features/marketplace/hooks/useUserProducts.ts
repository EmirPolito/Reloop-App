import { useEffect, useState } from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { subscribeUserProducts } from "../productRepository";
import type { Product } from "../types";
import type { FeedStatus } from "./useMarketplaceData";

const NO_PRODUCTS: Product[] = [];

interface Listing {
  ownerId: string;
  products: Product[];
  status: FeedStatus;
}

/** Publicaciones de una persona (la propia o la de otra), de la más reciente a la más antigua. */
export function useUserProducts(ownerId: string) {
  const { uid } = useSessionUser();
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(
    () =>
      subscribeUserProducts(
        ownerId,
        uid,
        (products) => setListing({ ownerId, products, status: "ready" }),
        (error) => {
          console.warn("No se pudo leer las publicaciones.", describeFirestoreError(error));
          setListing({ ownerId, products: NO_PRODUCTS, status: "error" });
        },
      ),
    [ownerId, uid],
  );

  // Si la persona cambia, lo guardado es de la anterior y se ignora hasta que llegue lo nuevo
  const current = listing?.ownerId === ownerId ? listing : null;
  return {
    products: current?.products ?? NO_PRODUCTS,
    status: current?.status ?? ("loading" as FeedStatus),
  };
}
