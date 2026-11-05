import { useCallback } from "react";

import { showErrorAlert } from "@/utils/alerts";
import { useMarketplaceActions } from "../MarketplaceProvider";

/** Marca o desmarca un favorito; si no se puede guardar, avisa. */
export function useToggleFavorite() {
  const { toggleFavorite } = useMarketplaceActions();

  return useCallback(
    (productId: string) => {
      toggleFavorite(productId).catch((error) =>
        showErrorAlert("No se pudo actualizar tus favoritos", error),
      );
    },
    [toggleFavorite],
  );
}
