import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { FondoHome } from "@/features/home/components/FondoHome";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import { CATEGORIES } from "@/features/marketplace/data";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { HeartIcon } from "./components/HeartIcon";

/** Todas o las de una categoría */
type Filtro = "todas" | CategoryId;

const OPCIONES: { id: Filtro; texto: string }[] = [
  { id: "todas", texto: "Todas" },
  ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
];

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
const SEPARACION = 16;
/** Mismo círculo que los botones de Notificaciones */
const LADO_BOTON = 48;

/**
 * Favoritos, con el mismo aspecto que Notificaciones: el fondo del inicio, el título al
 * centro, un buscador blanco (con "@" busca por quien vende), píldoras por categoría y las
 * publicaciones con la misma tarjeta del inicio.
 */
export function PantallaFavoritos() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { back, openProduct, openUserProfile } = useAppNavigation();
  const cardWidth = useProductCardWidth();
  const { products, loading } = useProductsByIds(favorites);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");

  // Primero las publicaciones más recientes, como en el inicio
  const favoriteProducts = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt),
    [products],
  );

  // Con "@" al inicio se busca por quien vende (su usuario o su nombre)
  const modoBusqueda = modoDeBusqueda(busqueda);
  const buscaPersonas = modoBusqueda.modo === "usuarios";
  const vendedores = useMemo(
    () => [...new Set(favoriteProducts.map((item) => item.ownerId))],
    [favoriteProducts],
  );
  const perfiles = usePerfilDe.varias(vendedores);

  const visibles = useMemo(() => {
    const category = filtro === "todas" ? null : filtro;
    if (!buscaPersonas) {
      return filterProducts(favoriteProducts, { query: busqueda, category });
    }
    const termino = modoBusqueda.termino;
    return filterProducts(favoriteProducts, { query: "", category }).filter(
      (item) =>
        !termino ||
        (perfiles.get(item.ownerId)?.username ?? "").includes(termino) ||
        normalizarNombre(item.seller).includes(termino),
    );
  }, [
    favoriteProducts,
    filtro,
    busqueda,
    buscaPersonas,
    modoBusqueda.termino,
    perfiles,
  ]);

  const texto = isDark ? "#F1F5F9" : "#101010";
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: isDark ? "#ffffff33" : "#ffffff",
  };
  const hayFiltro = filtro !== "todas" || busqueda.trim() !== "";
  const categoria = CATEGORIES.find((c) => c.id === filtro);

  return (
    <View style={styles.pantalla}>
      {/* El mismo fondo que Notificaciones (la pestaña ya deja libre la zona de la hora) */}
      <FondoHome intensidad={0.7} />

      {/* Volver a la izquierda, el título al centro y la campana a la derecha */}
      <View style={styles.barra}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={texto} />
          </View>
        </PressableScale>
        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          Favoritos
        </Text>
        <NotificationBellButton lado={LADO_BOTON} />
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar favoritos o @usuario"
        accessibilityLabel="Buscar en favoritos"
        personas={buscaPersonas}
      />

      <FiltrosPildoras opciones={OPCIONES} activo={filtro} onCambiar={setFiltro} />

      {loading && favoriteProducts.length === 0 ? (
        <LoadingState />
      ) : (
        <Animated.View key={filtro} entering={CAMBIO_FILTRO} style={styles.lista}>
          <FlatList
            data={visibles}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: SEPARACION }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              // Espacio para que la barra de navegación no tape la última publicación
              paddingBottom: insets.bottom + 110,
            }}
            renderItem={({ item }) => (
              <View style={{ marginBottom: SEPARACION }}>
                <TarjetaPublicacion
                  item={item}
                  cardWidth={cardWidth}
                  favorite
                  onOpen={openProduct}
                  onOpenSeller={openUserProfile}
                  onToggleFavorite={toggleFavorite}
                />
              </View>
            )}
            ListEmptyComponent={
              <IllustratedEmptyState
                icon={<HeartIcon size={80} />}
                title={
                  hayFiltro
                    ? categoria && !busqueda.trim()
                      ? `Nada de ${categoria.label.toLowerCase()}`
                      : "No encontramos nada"
                    : "Aún no tienes favoritos"
                }
                message={
                  hayFiltro
                    ? "Prueba con otra búsqueda o categoría."
                    : "Guarda los productos que te interesan y aparecerán aquí."
                }
                style={styles.vacio}
              />
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingTop: 8 },
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  botonBarra: {
    width: LADO_BOTON,
    height: LADO_BOTON,
    borderRadius: LADO_BOTON / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
  lista: { flex: 1 },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
