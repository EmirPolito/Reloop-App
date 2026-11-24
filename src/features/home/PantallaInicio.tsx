import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BloqueoScrollContext,
  esScrollAnidado,
  useBloqueoScroll,
} from "@/components/bloqueoScroll";
import { PausaBrilloContext } from "@/components/ui/PremiumBadge";
import { TRANSICION_MODULO } from "@/constants/motion";
import type { CategoryId } from "@/features/marketplace/types";
import { ResultadosUsuarios } from "@/features/busqueda/components/ResultadosUsuarios";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import {
  filterProducts,
  premiumPrimero,
} from "@/features/marketplace/feedFilters";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import { UNIVERSIDAD_PROPIA } from "@/features/marketplace/universidades";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useDuenosPremium } from "@/features/premium/hooks/useMembership";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import {
  ALTO_CABECERA,
  ALTO_FILA_PILDORAS,
  CabeceraInicio,
} from "./1-cabecera";
import { BannerInicio } from "./2-banner";
import { CategoriasInicio } from "./3-categorias";
import { TituloSeccion } from "./4-titulo";
import {
  AvisoError,
  AvisoSinPublicaciones,
  FilaPublicaciones,
  FilaVendedor,
  TransicionFiltroContext,
} from "./5-filas";
import { EsqueletoInicio } from "./6-esqueleto";
import { useEstilosInicio } from "./estilos";
import {
  buildHomeFeedRows,
  buildUserSearchRows,
  homeRowKey,
  type HomeFeedRow,
} from "./filasInicio";

/** Aire entre la cabecera fija y lo primero de la lista (el banner) */
const ESPACIO_BAJO_CABECERA = 12;

/**
 * Pantalla de inicio: la cabecera fija arriba y, debajo, una sola lista con el banner, las
 * categorías, el título y las publicaciones (ver `README.md`). Las pestañas siguen montadas
 * al navegar, así que conserva el scroll.
 */
export const PantallaInicio = memo(function PantallaInicio() {
  const { isDark } = useAppTheme();
  const estilos = useEstilosInicio();
  const {
    products: todos,
    status,
    favorites,
    filters,
    universidad,
  } = useMarketplaceState();
  const { toggleCategory, reload } = useMarketplaceActions();
  const toggleFavorite = useToggleFavorite();
  const { openProduct, openUserProfile, openSearch } = useNavegacion();
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
  // Buscar en un Set es directo (en el arreglo había que recorrerlo por cada tarjeta)
  const favoritos = useMemo(() => new Set(favorites), [favorites]);

  // Scroll de la lista (hilo de UI): la neblina de la cabecera y sus píldoras lo siguen
  const scrollY = useSharedValue(0);
  // Mientras se arrastran las fotos de una tarjeta grande, la lista no se mueve
  const { bloqueo, propsBloqueo } = useBloqueoScroll();
  // 1 mientras el dedo o la inercia mueven la lista
  const arrastre = useSharedValue(0);
  // Los eventos de las filas horizontales (categorías, carruseles) también llegan aquí: se
  // ignoran en todos, o arrastrar una fila pausaba y redibujaba lo de la lista a medio gesto
  const alHacerScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (esScrollAnidado(event)) return;
      scrollY.set(event.contentOffset.y);
    },
    onBeginDrag: (event) => {
      if (esScrollAnidado(event)) return;
      arrastre.set(1);
    },
    onEndDrag: (event) => {
      if (esScrollAnidado(event)) return;
      // En iOS, soltar sin velocidad no genera inercia (ni aviso de que terminó)
      if (Math.abs(event.velocity?.y ?? 0) < 0.05) arrastre.set(0);
    },
    onMomentumBegin: (event) => {
      if (esScrollAnidado(event)) return;
      arrastre.set(1);
    },
    onMomentumEnd: (event) => {
      if (esScrollAnidado(event)) return;
      arrastre.set(0);
    },
  });
  // Mientras la lista o un carrusel se mueven, las animaciones decorativas se detienen
  const pausa = useDerivedValue<number>(() =>
    arrastre.get() === 1 || bloqueo.get() === 1 ? 1 : 0,
  );

  // Alto del banner y de las categorías cuadradas: al pasar estas pueden salir las píldoras
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
  const umbralPildoras = useDerivedValue(() =>
    altoCategorias.get() > 0
      ? altoBanner.get() + altoCategorias.get() - ALTO_FILA_PILDORAS
      : 0,
  );

  // Al cambiar de categoría: las publicaciones salen (se desvanecen y bajan), se aplica el
  // filtro cuando ya no se ven y el contenido nuevo sube suave a su lugar
  const reducido = useReducedMotion();
  const filtro = useSharedValue(1);
  const filtrando = useRef(false);
  const elegirCategoria = useCallback(
    (category: CategoryId) => {
      if (reducido) {
        toggleCategory(category);
        return;
      }
      filtrando.current = true;
      filtro.set(
        withTiming(0, TRANSICION_MODULO.salida, (terminada) => {
          if (terminada) scheduleOnRN(toggleCategory, category);
        }),
      );
    },
    [reducido, filtro, toggleCategory],
  );
  // Ya con el filtro aplicado (la lista nueva dibujada), entra
  useEffect(() => {
    if (!filtrando.current) return;
    filtrando.current = false;
    filtro.set(withTiming(1, TRANSICION_MODULO.entrada));
  }, [activeCategory, filtro]);

  // Cada tipo de fila tiene su componente memorizado: aunque esta función se cree de nuevo,
  // las filas que no cambiaron no se vuelven a dibujar
  const renderItem = useCallback(
    ({ item }: { item: HomeFeedRow }) => {
      switch (item.type) {
        case "banner":
          return (
            <View onLayout={alMedirBanner}>
              <BannerInicio />
            </View>
          );
        case "categories":
          return (
            <View onLayout={alMedirCategorias}>
              <CategoriasInicio
                activeCategory={activeCategory}
                onToggleCategory={elegirCategoria}
              />
            </View>
          );
        case "sectionTitle":
          return (
            <TituloSeccion activeCategory={activeCategory} count={item.count} />
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
          return <AvisoError onReintentar={reload} />;
        case "empty":
          return (
            <AvisoSinPublicaciones
              universidad={universidad}
              sinComunidad={sinComunidad}
              query={query}
              activeCategory={activeCategory}
            />
          );
        case "seller":
          return (
            <FilaVendedor
              ownerId={item.ownerId}
              products={item.products}
              isDark={isDark}
              onOpen={openProduct}
            />
          );
        case "products":
          return (
            <FilaPublicaciones
              products={item.products}
              cardWidth={cardWidth}
              favoritos={favoritos}
              onOpen={openProduct}
              onOpenSeller={openUserProfile}
              onToggleFavorite={toggleFavorite}
            />
          );
      }
    },
    [
      isDark,
      activeCategory,
      query,
      sinComunidad,
      universidad,
      cardWidth,
      favoritos,
      openProduct,
      openUserProfile,
      toggleFavorite,
      elegirCategoria,
      reload,
      alMedirBanner,
      alMedirCategorias,
    ],
  );

  return (
    <BloqueoScrollContext.Provider value={bloqueo}>
      <PausaBrilloContext.Provider value={pausa}>
        <TransicionFiltroContext.Provider value={filtro}>
          <View style={{ flex: 1 }}>
            <Animated.FlatList
              animatedProps={propsBloqueo}
              style={estilos.lista}
              data={rows}
              keyExtractor={homeRowKey}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                estilos.contenido,
                // Empieza debajo de la cabecera fija
                { paddingTop: arriba + ALTO_CABECERA + ESPACIO_BAJO_CABECERA },
              ]}
              onScroll={alHacerScroll}
              scrollEventThrottle={16}
              renderItem={renderItem}
              initialNumToRender={6}
              maxToRenderPerBatch={4}
              windowSize={7}
              // En iOS recortar las vistas fuera de pantalla da parpadeos con tarjetas que
              // tienen su propio scroll; en Android sí ayuda (es lo que hace por defecto)
              removeClippedSubviews={Platform.OS === "android"}
            />
            <CabeceraInicio
              scrollY={scrollY}
              arrastre={arrastre}
              arriba={arriba}
              umbralPildoras={umbralPildoras}
              activeCategory={activeCategory}
              onToggleCategory={elegirCategoria}
              onBuscar={openSearch}
            />
          </View>
        </TransicionFiltroContext.Provider>
      </PausaBrilloContext.Provider>
    </BloqueoScrollContext.Provider>
  );
});
