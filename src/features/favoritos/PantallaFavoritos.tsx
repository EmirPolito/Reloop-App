import { useMemo } from "react";
import { View } from "react-native";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { TabScreenLayout } from "@/components/ui/TabScreenLayout";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { HeartIcon } from "./components/HeartIcon";

export function PantallaFavoritos() {
  const { styles } = useAppTheme();
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { openProduct, openUserProfile } = useAppNavigation();
  const cardWidth = useProductCardWidth();
  const { products, loading } = useProductsByIds(favorites);

  // Primero las publicaciones más recientes, como en el inicio
  const favoriteProducts = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt),
    [products],
  );

  return (
    <TabScreenLayout title="Favoritos" headerSpacing={25}>
      {favoriteProducts.length === 0 ? (
        loading ? (
          <LoadingState />
        ) : (
          <IllustratedEmptyState
            icon={<HeartIcon size={80} />}
            title="Aún no tienes favoritos"
            message="Guarda los productos que te interesan y aparecerán aquí."
            style={{ paddingVertical: 174 }}
          />
        )
      ) : (
        <View style={{ gap: 4 }}>
          <View style={styles.productGrid}>
            {favoriteProducts.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                cardWidth={cardWidth}
                favorite
                onOpen={openProduct}
                onOpenSeller={openUserProfile}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </View>
        </View>
      )}
    </TabScreenLayout>
  );
}
