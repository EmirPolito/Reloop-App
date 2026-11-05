import { memo, useCallback, useMemo } from "react";
import { FlatList, View } from "react-native";

import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { CategoryRow } from "./components/CategoryRow";
import { FeedIntro } from "./components/FeedIntro";
import { HomeHeader } from "./components/HomeHeader";
import { buildHomeFeedRows, homeRowKey, type HomeFeedRow } from "./feedRows";

/** Posición de la fila de categorías (la cabecera cuenta como índice 0): queda fija al hacer scroll. */
const STICKY_HEADER_INDICES = [1];

/** Pantalla de inicio. Las pestañas siguen montadas al navegar, así que conserva el scroll. */
export const HomeScreen = memo(function HomeScreen() {
  const { styles } = useAppTheme();
  const { profile } = useProfile();
  const { products, status, favorites, filters } = useMarketplaceState();
  const { setQuery, toggleCategory, clearCategory, reload } =
    useMarketplaceActions();
  const toggleFavorite = useToggleFavorite();
  const { navigate, openProduct, openUserProfile } = useAppNavigation();
  const cardWidth = useProductCardWidth();

  const rows = useMemo(
    () => buildHomeFeedRows(filterProducts(products, filters), status),
    [products, filters, status],
  );
  const openProfileTab = useCallback(() => navigate("profile"), [navigate]);

  const { query, category: activeCategory } = filters;

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedRow }) => {
      switch (item.type) {
        case "categories":
          return (
            <CategoryRow
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
          );
        case "banner":
          return (
            <FeedIntro
              activeCategory={activeCategory}
              onClearCategory={clearCategory}
            />
          );
        case "loading":
          return <LoadingState />;
        case "error":
          return (
            <View>
              <EmptyState
                title="No pudimos cargar las publicaciones"
                message="Revisa tu conexión e inténtalo de nuevo."
                icon="search"
              />
              <PrimaryButton label="Reintentar" onPress={reload} />
            </View>
          );
        case "empty":
          return (
            <EmptyState
              title={
                query || activeCategory
                  ? "No encontramos publicaciones"
                  : "Tu comunidad empieza aquí"
              }
              message={
                query || activeCategory
                  ? "Prueba con otra búsqueda o categoría."
                  : "Sé la primera persona en publicar. Comparte algo con la comunidad UTSV."
              }
              icon={query ? "search" : "sell"}
            />
          );
        case "products":
          return (
            <View style={styles.productRow}>
              {item.products.map((product) => (
                <ProductCard
                  key={product.id}
                  item={product}
                  cardWidth={cardWidth}
                  favorite={favorites.includes(product.id)}
                  onOpen={openProduct}
                  onOpenSeller={openUserProfile}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
              {item.products.length === 1 ? (
                <View style={{ width: cardWidth }} />
              ) : null}
            </View>
          );
      }
    },
    [
      styles,
      activeCategory,
      query,
      cardWidth,
      favorites,
      openProduct,
      openUserProfile,
      toggleFavorite,
      toggleCategory,
      clearCategory,
      reload,
    ],
  );

  return (
    <FlatList
      style={styles.homeList}
      data={rows}
      keyExtractor={homeRowKey}
      stickyHeaderIndices={STICKY_HEADER_INDICES}
      contentContainerStyle={styles.productsContent}
      ListHeaderComponent={
        <HomeHeader
          profileName={profile.name}
          profilePhoto={profile.photo}
          query={query}
          onChangeQuery={setQuery}
          onOpenProfile={openProfileTab}
          onClearCategory={clearCategory}
        />
      }
      renderItem={renderItem}
      initialNumToRender={6}
      maxToRenderPerBatch={4}
      windowSize={7}
      removeClippedSubviews
    />
  );
});
