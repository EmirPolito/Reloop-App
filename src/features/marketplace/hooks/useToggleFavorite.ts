import { useCallback } from "react";

import { useAvisos } from "@/features/avisos/AvisosProvider";
import { showErrorAlert } from "@/utils/alerts";
import { useMarketplaceActions } from "../MarketplaceProvider";

/** Marca o desmarca un favorito; si no se puede guardar, avisa. */
export function useToggleFavorite() {
  const { toggleFavorite } = useMarketplaceActions();
  const { mostrar } = useAvisos();

  return useCallback(
    (productId: string) => {
      toggleFavorite(productId)
        .then((favorite) =>
          // Solo un aviso arriba: no se guarda en el módulo de notificaciones
          mostrar(
            favorite
              ? {
                  tipo: "favorito",
                  titulo: "Guardada en favoritos",
                  descripcion: "Podrás verla en tu lista de favoritos.",
                }
              : {
                  tipo: "sinFavorito",
                  titulo: "Eliminada de favoritos",
                  descripcion: "Ya no aparece en tu lista de favoritos.",
                },
          ),
        )
        .catch((error) =>
          showErrorAlert("No se pudo actualizar tus favoritos", error),
        );
    },
    [toggleFavorite, mostrar],
  );
}
