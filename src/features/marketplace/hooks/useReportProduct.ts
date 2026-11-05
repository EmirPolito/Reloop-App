import { useCallback } from "react";

import { showAlert, showErrorAlert } from "@/utils/alerts";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "../MarketplaceProvider";
import type { Product } from "../types";

/** Pide confirmación y reporta la publicación. */
export function useReportProduct() {
  const { reported } = useMarketplaceState();
  const { reportProduct } = useMarketplaceActions();

  return useCallback(
    (product: Product) => {
      if (reported.includes(product.id)) return;
      showAlert(
        "Reportar publicación",
        `¿Quieres reportar "${product.name}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Reportar",
            style: "destructive",
            onPress: () => {
              reportProduct(product.id).then(
                () =>
                  showAlert(
                    "Reporte enviado",
                    "Gracias por ayudar a mantener segura la comunidad.",
                  ),
                (error) => showErrorAlert("No se pudo enviar el reporte", error),
              );
            },
          },
        ],
      );
    },
    [reported, reportProduct],
  );
}
