import { useCallback, useState } from "react";

import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { useMarketplaceActions } from "@/features/marketplace/MarketplaceProvider";
import { MIN_PARA_TARJETA } from "@/features/marketplace/sellerGroups";
import { createProduct } from "@/features/marketplace/productRepository";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useProfile } from "@/features/perfil/ProveedorPerfil";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { uploadImage } from "@/lib/cloudinary";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import {
  buildNewProduct,
  validateDraft,
  type ProductDraft,
} from "../draftRules";

/**
 * Valida el borrador, sube la foto a Cloudinary, guarda la publicación y vuelve al inicio.
 * `publish` devuelve `true` si se publicó, para que la pantalla limpie el formulario;
 * `publishing` es verdadero mientras sube y guarda.
 */
export function usePublishProduct() {
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const { clearFilters } = useMarketplaceActions();
  const { products: mias } = useUserProducts(uid);
  // La tarjeta grande solo es para quien tiene insignia (Premium)
  const premium = useIsPremium(uid);
  const { mostrar } = useAvisos();
  const { navigate } = useNavegacion();
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
            availableQuantity: result.availableQuantity,
            imageUrl,
          }),
        );
        // Sin filtros activos, la publicación nueva se ve en el inicio
        clearFilters();
        navigate("home");
        // Con la publicación que completa la tarjeta, se avisa cómo se verán y que se pueden diseñar
        if (premium && mias.length + 1 === MIN_PARA_TARJETA) {
          mostrar({
            tipo: "exito",
            titulo: "Tus publicaciones tienen nueva vista",
            descripcion:
              "Con 3 se acomodan en una tarjeta con desplazamiento lateral. Diséñala desde tu perfil, con el lápiz.",
          });
        }
        return true;
      } catch (error) {
        showErrorAlert("No se pudo publicar", error);
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [uid, profile.name, clearFilters, navigate, mias.length, mostrar, premium],
  );

  return { publish, publishing };
}
