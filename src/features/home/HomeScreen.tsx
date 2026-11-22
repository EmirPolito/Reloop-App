import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  filterProducts,
  premiumPrimero,
} from "@/features/marketplace/feedFilters";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";

import { ResultadosUsuarios } from "@/features/busqueda/components/ResultadosUsuarios";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import {
  UNIVERSIDAD_PROPIA,
  universidadPorId,
} from "@/features/marketplace/universidades";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { TarjetaVendedorDe } from "@/features/perfil/components/TarjetaVendedorDe";
import { useDuenosPremium } from "@/features/premium/hooks/useMembership";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { memo, useCallback, useMemo } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import {
  BuscadorEnLista,
  BuscadorFlotante,
  MARGEN_FIJO,
} from "./components/BuscadorFlotante";
import { ALTO_PILDORA } from "@/features/busqueda/components/PildoraCristal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryRow } from "./components/CategoryRow";
import { HomeHeader } from "./components/HomeHeader";
import { FeedIntro } from "./components/SectionAnuncio";
import { SectionTitle } from "./components/SectionTitle";
import { TarjetaPublicacion } from "./components/TarjetaPublicacion";
import {
  buildHomeFeedRows,
  buildUserSearchRows,
  homeRowKey,
  type HomeFeedRow,
} from "./feedRows";

/** Pantalla de inicio. Las pestañas siguen montadas al navegar, así que conserva el scroll. */
export const HomeScreen = memo(function HomeScreen() {
  const { styles, isDark } = useAppTheme();
  const {
    products: todos,
    status,
    favorites,
    filters,
    universidad,
  } = useMarketplaceState();
  const { toggleCategory, reload } = useMarketplaceActions();
  const toggleFavorite = useToggleFavorite();
  const { openProduct, openUserProfile, openSearch } = useAppNavigation();
  const cardWidth = useProductCardWidth(2);
  // La pestaña llega hasta arriba del todo: la lista deja libre la barra de estado
  const { top: arriba } = useSafeAreaInsets();

  const busqueda = modoDeBusqueda(filters.query);
  const buscaUsuarios = busqueda.modo === "usuarios";
  // Solo las de la universidad elegida (las que no dicen cuál son de la propia)
  const products = useMemo(
    () =>
      todos.filter(
        (product) =>
          (product.universidad ?? UNIVERSIDAD_PROPIA) === universidad,
      ),
    [todos, universidad],
  );
  const sinComunidad = universidad !== UNIVERSIDAD_PROPIA;
  // Las publicaciones de quienes tienen Premium salen primero
  const duenos = useMemo(
    () => [...new Set(products.map((product) => product.ownerId))],
    [products],
  );
  const premium = useDuenosPremium(duenos);
  const rows = useMemo(
    () =>
      buscaUsuarios
        ? buildUserSearchRows(busqueda.termino)
        : buildHomeFeedRows(
            premiumPrimero(filterProducts(products, filters), premium),
            status,
            premium,
          ),
    [buscaUsuarios, busqueda.termino, products, filters, status, premium],
  );
  const { query, category: activeCategory } = filters;

  // Posiciones para el buscador flotante y sus píldoras de categorías (hilo de UI)
  const scrollY = useSharedValue(0);
  const buscadorY = useSharedValue(-1);
  const altoCabecera = useSharedValue(0);
  const altoBanner = useSharedValue(0);
  const altoCategorias = useSharedValue(0);
  const alHacerScroll = useAnimatedScrollHandler((event) => {
    // Los carruseles horizontales de las tarjetas también mandan sus eventos aquí (con y = 0):
    // sin este filtro el buscador flotante y las píldoras parpadeaban al arrastrar las fotos.
    // La lista solo se mueve en vertical: un contenido más ancho que la vista es de un carrusel.
    if (event.contentSize.width > event.layoutMeasurement.width + 1) return;
    scrollY.set(event.contentOffset.y);
  });
  const alMedirBuscador = useCallback(
    (event: LayoutChangeEvent) =>
      buscadorY.set(arriba + event.nativeEvent.layout.y),
    [buscadorY, arriba],
  );
  const alMedirCabecera = useCallback(
    (event: LayoutChangeEvent) =>
      altoCabecera.set(event.nativeEvent.layout.height),
    [altoCabecera],
  );
  const alMedirBanner = useCallback(
    (event: LayoutChangeEvent) =>
      altoBanner.set(event.nativeEvent.layout.height),
    [altoBanner],
  );
  const alMedirCategorias = useCallback(
    (event: LayoutChangeEvent) =>
      altoCategorias.set(event.nativeEvent.layout.height),
    [altoCategorias],
  );
  // Las píldoras aparecen cuando la fila de categorías ya quedó oculta tras el buscador fijo
  const umbralPildoras = useDerivedValue(() =>
    altoCategorias.get() > 0
      ? arriba +
        altoCabecera.get() +
        altoBanner.get() +
        altoCategorias.get() -
        (arriba + MARGEN_FIJO + ALTO_PILDORA)
      : 0,
  );
  const cabecera = useMemo(
    () => (
      <View onLayout={alMedirCabecera}>
        <HomeHeader
          onLayoutBuscador={alMedirBuscador}
          buscador={
            <BuscadorEnLista
              scrollY={scrollY}
              reposoY={buscadorY}
              arriba={arriba}
              onPress={openSearch}
            />
          }
        />
      </View>
    ),
    [alMedirCabecera, alMedirBuscador, scrollY, buscadorY, arriba, openSearch],
  );

  const renderItem = useCallback(
    ({ item }: { item: HomeFeedRow }) => {
      switch (item.type) {
        case "banner":
          return (
            <View onLayout={alMedirBanner}>
              <FeedIntro />
            </View>
          );
        case "categories":
          return (
            <View onLayout={alMedirCategorias}>
              <CategoryRow
                activeCategory={activeCategory}
                onToggleCategory={toggleCategory}
              />
            </View>
          );
        case "sectionTitle":
          return (
            <SectionTitle activeCategory={activeCategory} count={item.count} />
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
                sinComunidad
                  ? `Aún no hay publicaciones en ${universidadPorId(universidad).sigla}`
                  : query || activeCategory
                    ? "No encontramos publicaciones"
                    : "Tu comunidad empieza aquí"
              }
              message={
                sinComunidad
                  ? "Cuando la comunidad de esa universidad empiece a publicar, las verás aquí."
                  : query || activeCategory
                    ? "Prueba con otra búsqueda o categoría."
                    : "Sé la primera persona en publicar. Comparte algo con la comunidad UTSV."
              }
              icon={query ? "search" : "sell"}
            />
          );
        case "seller":
          return (
            // Ancho completo (no una fila de dos): la tarjeta mide sus fotos según su ancho
            <View style={{ width: "100%", marginBottom: 16 }}>
              <TarjetaVendedorDe
                ownerId={item.ownerId}
                products={item.products}
                isDark={isDark}
                onOpen={openProduct}
              />
            </View>
          );
        case "products":
          return (
            <View style={styles.productRow}>
              {item.products.map((product) => (
                <TarjetaPublicacion
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
      sinComunidad,
      universidad,
      cardWidth,
      favorites,
      openProduct,
      openUserProfile,
      toggleFavorite,
      toggleCategory,
      reload,
      alMedirBanner,
      alMedirCategorias,
    ],
  );

  return (
    <View style={{ flex: 1 }}>
      <Animated.FlatList
        style={styles.homeList}
        data={rows}
        keyExtractor={homeRowKey}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.productsContent, { paddingTop: arriba }]}
        ListHeaderComponent={cabecera}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
      />
      <BuscadorFlotante
        scrollY={scrollY}
        reposoY={buscadorY}
        arriba={arriba}
        umbralPildoras={umbralPildoras}
        activeCategory={activeCategory}
        onToggleCategory={toggleCategory}
        onPress={openSearch}
      />
    </View>
  );
});
