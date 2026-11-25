import { useCallback, useEffect, useState } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";
import {
  subscribeFavorites,
  subscribeMyReports,
  subscribeProducts,
} from "../productRepository";
import type { Product } from "../types";

export type FeedStatus = "loading" | "ready" | "error";

const NO_IDS: string[] = [];

interface Feed {
  products: Product[];
  status: FeedStatus;
}

const LOADING_FEED: Feed = { products: [], status: "loading" };

function logFailure(scope: string) {
  return (error: unknown) =>
    console.warn(`No se pudo leer ${scope}.`, describeFirestoreError(error));
}

/**
 * Datos compartidos del marketplace, en tiempo real: las publicaciones más recientes y
 * lo propio de esta persona (favoritos y reportes). Las suscripciones
 * duran lo que dura la sesión; `reload` las vuelve a abrir tras un error.
 */
export function useMarketplaceData(uid: string) {
  const [attempt, setAttempt] = useState(0);
  const [feed, setFeed] = useState<Feed>(LOADING_FEED);
  const [favorites, setFavorites] = useState<string[]>(NO_IDS);
  const [reported, setReported] = useState<string[]>(NO_IDS);

  useEffect(() => {
    const unsubscribers = [
      subscribeProducts(
        uid,
        (products) => setFeed({ products, status: "ready" }),
        (error) => {
          logFailure("las publicaciones")(error);
          setFeed((current) => ({ ...current, status: "error" }));
        },
      ),
      subscribeFavorites(uid, setFavorites, logFailure("los favoritos")),
      subscribeMyReports(uid, setReported, logFailure("los reportes")),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid, attempt]);

  const reload = useCallback(() => {
    setFeed(LOADING_FEED);
    setAttempt((current) => current + 1);
  }, []);

  return {
    products: feed.products,
    status: feed.status,
    favorites,
    reported,
    reload,
  };
}
