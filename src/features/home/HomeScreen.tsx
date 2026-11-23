import {
  BloqueoScrollContext,
  useBloqueoScroll,
} from "@/components/bloqueoScroll";
import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { PausaBrilloContext } from "@/components/ui/PremiumBadge";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ALTO_CABECERA,
  ALTO_FILA_PILDORAS,
  CabeceraInicio,
} from "./components/BuscadorFlotante";
import { CategoryRow } from "./components/CategoryRow";
import { EsqueletoInicio } from "./components/EsqueletoInicio";
import { FeedIntro } from "./components/SectionAnuncio";
import { SectionTitle } from "./components/SectionTitle";
import { TarjetaPublicacion } from "./components/TarjetaPublicacion";
import {
  buildHomeFeedRows,
  buildUserSearchRows,
  homeRowKey,
  type HomeFeedRow,
} from "./feedRows";

/** Aire entre la cabecera fija y lo primero de la lista (el banner) */
const ESPACIO_BAJO_CABECERA = 12;

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

  // Posiciones para las píldoras de categorías que flotan arriba (hilo de UI)
  const scrollY = useSharedValue(0);
  // Mientras se arrastran las fotos de una tarjeta grande, la lista no se mueve
  const { bloqueo, propsBloqueo } = useBloqueoScroll();
  // 1 mientras el dedo o la inercia mueven la lista
  const arrastre = useSharedValue(0);
  const alHacerScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      // Un contenido más ancho que la vista es un carrusel de una tarjeta, no la lista
      if (event.contentSize.width > event.layoutMeasurement.width + 1) return;
      scrollY.set(event.contentOffset.y);
    },
    onBeginDrag: () => {
      arrastre.set(1);
    },
    onEndDrag: (event) => {
      // En iOS, soltar sin velocidad no genera inercia (ni aviso de que terminó)
      if (Math.abs(event.velocity?.y ?? 0) < 0.05) arrastre.set(0);
    },
    onMomentumBegin: () => {
      arrastre.set(1);
    },
    onMomentumEnd: () => {
      arrastre.set(0);
    },
  });
  // Mientras la lista o un carrusel se mueven, las animaciones decorativas se detienen
  const pausa = useDerivedValue<number>(() =>
    arrastre.get() === 1 || bloqueo.get() === 1 ? 1 : 0,
  );

  // Alto del banner y de las categorías cuadradas: al pasar estas salen las píldoras
  const altoBanner = useSharedValue(0);
  const altoCategorias = useSharedValue(0);
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
  // Las categorías cuadradas terminan de pasar por debajo de donde salen las píldoras
  const umbralPildoras = useDerivedValue(() =>
    altoCategorias.get() > 0
      ? altoBanner.get() + altoCategorias.get() - ALTO_FILA_PILDORAS
      : 0,
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
          return <EsqueletoInicio cardWidth={cardWidth} />;
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
            <View style={{ width: "100%", marginBottom: 17 }}>
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
    <BloqueoScrollContext.Provider value={bloqueo}>
      <PausaBrilloContext.Provider value={pausa}>
        <View style={{ flex: 1 }}>
          <Animated.FlatList
            animatedProps={propsBloqueo}
            style={styles.homeList}
            data={rows}
            keyExtractor={homeRowKey}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.productsContent,
              // Empieza debajo de la cabecera fija
              { paddingTop: arriba + ALTO_CABECERA + ESPACIO_BAJO_CABECERA },
            ]}
            onScroll={alHacerScroll}
            scrollEventThrottle={16}
            renderItem={renderItem}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={7}
            removeClippedSubviews
          />
          <CabeceraInicio
            scrollY={scrollY}
            arrastre={arrastre}
            arriba={arriba}
            umbralPildoras={umbralPildoras}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
            onBuscar={openSearch}
          />
        </View>
      </PausaBrilloContext.Provider>
    </BloqueoScrollContext.Provider>
  );
});
