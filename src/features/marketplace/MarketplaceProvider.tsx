import {
  createContext,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
} from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import { filtersReducer, NO_FILTERS, type FeedFilters } from "./feedFilters";
import {
  useMarketplaceData,
  type FeedStatus,
} from "./hooks/useMarketplaceData";
import {
  rateProduct as saveRating,
  removeFavorites,
  reportProduct as saveReport,
  setFavorite as saveFavorite,
} from "./productRepository";
import type { CategoryId, Product } from "./types";
import { UNIVERSIDAD_PROPIA } from "./universidades";

export interface MarketplaceState {
  products: Product[];
  /** Estado de la carga de las publicaciones del inicio. */
  status: FeedStatus;
  /** ids de productos marcados como favoritos */
  favorites: string[];
  /** calificación de esta persona por id de producto */
  ratings: Record<string, number>;
  /** ids de productos que esta persona ya reportó */
  reported: string[];
  filters: FeedFilters;
  /** Universidad cuyas publicaciones se ven en el inicio (id de `universidades.ts`). */
  universidad: string;
}

interface MarketplaceActions {
  /** Las acciones sobre datos devuelven la promesa para que quien llama muestre el error. */
  toggleFavorite: (productId: string) => Promise<boolean>;
  /** Quita varios favoritos a la vez, sin avisos (Favoritos muestra uno solo) */
  removeFavorites: (productIds: string[]) => Promise<void>;
  rateProduct: (productId: string, rating: number) => Promise<void>;
  reportProduct: (productId: string) => Promise<void>;
  setQuery: (query: string) => void;
  setUniversidad: (universidad: string) => void;
  toggleCategory: (category: CategoryId) => void;
  clearCategory: () => void;
  clearFilters: () => void;
  /** Vuelve a cargar las publicaciones después de un error. */
  reload: () => void;
}

const MarketplaceStateContext = createContext<MarketplaceState | null>(null);
const MarketplaceActionsContext = createContext<MarketplaceActions | null>(
  null,
);

/**
 * Catálogo de productos y todo lo que la persona hace sobre ellos (favoritos,
 * calificaciones, reportes y filtros del inicio). Estado y acciones van en contextos
 * separados: las acciones son estables, así que quien solo dispara acciones no se
 * renderiza cuando cambia el estado.
 */
export function MarketplaceProvider({ children }: PropsWithChildren) {
  const { uid } = useSessionUser();
  const data = useMarketplaceData(uid);
  const [filters, dispatchFilters] = useReducer(filtersReducer, NO_FILTERS);
  const [universidad, setUniversidad] = useState(UNIVERSIDAD_PROPIA);
  const favoritesRef = useLatestRef(data.favorites);
  const { reload } = data;

  const state = useMemo<MarketplaceState>(
    () => ({
      products: data.products,
      status: data.status,
      favorites: data.favorites,
      ratings: data.ratings,
      reported: data.reported,
      filters,
      universidad,
    }),
    [
      data.products,
      data.status,
      data.favorites,
      data.ratings,
      data.reported,
      filters,
      universidad,
    ],
  );

  const actions = useMemo<MarketplaceActions>(
    () => ({
      toggleFavorite: async (productId) => {
        const favorite = !favoritesRef.current.includes(productId);
        await saveFavorite(uid, productId, favorite);
        return favorite;
      },
      removeFavorites: (productIds) => removeFavorites(uid, productIds),
      rateProduct: (productId, rating) => saveRating(uid, productId, rating),
      reportProduct: (productId) => saveReport(uid, productId),
      setQuery: (query) => dispatchFilters({ type: "queryChanged", query }),
      setUniversidad,
      toggleCategory: (category) =>
        dispatchFilters({ type: "categoryToggled", category }),
      clearCategory: () => dispatchFilters({ type: "categoryCleared" }),
      clearFilters: () => dispatchFilters({ type: "filtersCleared" }),
      reload,
    }),
    [uid, favoritesRef, reload],
  );

  return (
    <MarketplaceStateContext.Provider value={state}>
      <MarketplaceActionsContext.Provider value={actions}>
        {children}
      </MarketplaceActionsContext.Provider>
    </MarketplaceStateContext.Provider>
  );
}

export function useMarketplaceState(): MarketplaceState {
  return useRequiredContext(MarketplaceStateContext, "MarketplaceProvider");
}

export function useMarketplaceActions(): MarketplaceActions {
  return useRequiredContext(MarketplaceActionsContext, "MarketplaceProvider");
}
