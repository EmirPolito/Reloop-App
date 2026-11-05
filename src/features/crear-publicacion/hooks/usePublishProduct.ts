import { useCallback, useState } from "react";

import { useMarketplaceActions } from "@/features/marketplace/MarketplaceProvider";
import { createProduct } from "@/features/marketplace/productRepository";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { uploadImage } from "@/lib/cloudinary";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { buildNewProduct, validateDraft, type ProductDraft } from "../draftRules";

/**
 * Valida el borrador, sube la foto a Cloudinary, guarda la publicación y vuelve al inicio.
 * `publish` devuelve `true` si se publicó, para que la pantalla limpie el formulario;
 * `publishing` es verdadero mientras sube y guarda.
 */
export function usePublishProduct() {
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const { clearFilters } = useMarketplaceActions();
  const { navigate } = useAppNavigation();
  const [publishing, setPublishing] = useState(false);

  const publish = useCallback(
    async (draft: ProductDraft): Promise<boolean> => {
      const result = validateDraft(draft);
      if (!result.valid) {
        showAlert(result.title, result.message);
        return false;
      }

      setPublishing(true);
      try {
        const imageUrl = draft.photo ? await uploadImage(draft.photo) : null;
        await createProduct(
          buildNewProduct(draft, {
            ownerId: uid,
            seller: profile.name,
            price: result.price,
            imageUrl,
          }),
        );
        // Sin filtros activos, la publicación nueva se ve en el inicio
        clearFilters();
        navigate("home");
        return true;
      } catch (error) {
        showErrorAlert("No se pudo publicar", error);
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [uid, profile.name, clearFilters, navigate],
  );

  return { publish, publishing };
}
