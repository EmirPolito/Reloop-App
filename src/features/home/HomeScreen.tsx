import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { ResultadosUsuarios } from "@/features/busqueda/components/ResultadosUsuarios";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { memo, useCallback, useMemo } from "react";
import { FlatList, View } from "react-native";
import { CategoryRow } from "./components/CategoryRow";
import { HomeHeader } from "./components/HomeHeader";
import { FeedIntro } from "./components/SectionAnuncio";
import { SectionTitle } from "./components/SectionTitle";
import {
  buildHomeFeedRows,
  buildUserSearchRows,
  homeRowKey,
  type HomeFeedRow,
} from "./feedRows";
/** Posición de la fila de categorías (cabecera = 0, banner = 1): queda fija al hacer scroll. */
const STICKY_HEADER_INDICES = [2];
/** En el modo "@" no hay fila de categorías que fijar */
const SIN_STICKY: number[] = [];

/** Pantalla de inicio. Las pestañas siguen montadas al navegar, así que conserva el scroll. */
export const HomeScreen = memo(function HomeScreen() {
  const { styles, isDark } = useAppTheme();
  const { products, status, favorites, filters } = useMarketplaceState();
  const { setQuery, toggleCategory, clearCategory, reload } =
    useMarketplaceActions();
  const toggleFavorite = useToggleFavorite();
  const { openProduct, openUserProfile } = useAppNavigation();
  const cardWidth = useProductCardWidth();

  const busqueda = modoDeBusqueda(filters.query);
  const buscaUsuarios = busqueda.modo === "usuarios";
  const rows = useMemo(
    () =>
      buscaUsuarios
        ? buildUserSearchRows(busqueda.termino)
        : buildHomeFeedRows(filterProducts(products, filters), status),
    [buscaUsuarios, busqueda.termino, products, filters, status],
  );
  const { query, category: activeCategory } = filters;

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedRow }) => {
      switch (item.type) {
        case "banner":
          return <FeedIntro />;
        case "categories":
          return (
            <CategoryRow
              activeCategory={activeCategory}
              onToggleCategory={toggleCategory}
            />
          );
        case "sectionTitle":
          return (
            <SectionTitle
              activeCategory={activeCategory}
              onClearCategory={clearCategory}
            />
          );
        case "users":
          return (
            <ResultadosUsuarios
              termino={item.term}
              isDark={isDark}
              onOpenUser={openUserProfile}
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
      isDark,
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
      stickyHeaderIndices={buscaUsuarios ? SIN_STICKY : STICKY_HEADER_INDICES}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.productsContent}
      ListHeaderComponent={
        <HomeHeader
          query={query}
          onChangeQuery={setQuery}
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
