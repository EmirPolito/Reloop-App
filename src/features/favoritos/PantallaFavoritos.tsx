import { Ionicons } from "@expo/vector-icons";
import { IconoEliminarLinea } from "@/features/perfil/Perfiliconos";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
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
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert } from "@/utils/alerts";
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
  const seleccion = useSeleccion();
  const [menu, setMenu] = useState(false);

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
  const { activo, marcados } = seleccion;

  const eliminar = () => {
    const ids = [...marcados];
    if (ids.length === 0) return;
    showAlert(
      ids.length === 1
        ? "¿Quitar este favorito?"
        : `¿Quitar ${ids.length} favoritos?`,
      undefined,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            ids.forEach((id) => toggleFavorite(id));
            seleccion.salir();
          },
        },
      ],
    );
  };
  const hayFiltro = filtro !== "todas" || busqueda.trim() !== "";
  const categoria = CATEGORIES.find((c) => c.id === filtro);

  return (
    <View style={styles.pantalla}>
      {/* El mismo fondo que Notificaciones (la pestaña ya deja libre la zona de la hora) */}
      <FondoHome intensidad={0.7} />

      {/* Volver a la izquierda, el título al centro y la campana a la derecha */}
      <View style={styles.barra}>
        {activo ? (
          <BotonBarra etiqueta="Cancelar selección" onPress={seleccion.salir}>
            <Ionicons name="close" size={26} color={texto} />
          </BotonBarra>
        ) : (
          <BotonBarra etiqueta="Volver" onPress={back}>
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={28} color={texto} />
            </View>
          </BotonBarra>
        )}
        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          {activo
            ? marcados.size === 0
              ? "Selecciona favoritos"
              : `${marcados.size} seleccionado${marcados.size === 1 ? "" : "s"}`
            : "Favoritos"}
        </Text>
        {activo ? (
          <BotonBarra
            etiqueta="Quitar favoritos seleccionados"
            peligro
            disabled={marcados.size === 0}
            onPress={eliminar}
          >
            <IconoEliminarLinea size={26} color={"#FFFFFF"} />
          </BotonBarra>
        ) : (
          <BotonBarra
            etiqueta="Eliminar favoritos"
            disabled={favoriteProducts.length === 0}
            onPress={() => setMenu(true)}
          >
            <IconoEliminarLinea size={26} color={"#FF8A1F"} />
          </BotonBarra>
        )}
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
            extraData={marcados}
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
                {activo ? (
                  // En selección, tocar la tarjeta la marca o desmarca
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar ${item.name}`}
                    accessibilityState={{ selected: marcados.has(item.id) }}
                    onPress={() => seleccion.alternar(item.id)}
                    style={StyleSheet.absoluteFill}
                  >
                    <View
                      style={[
                        styles.check,
                        marcados.has(item.id)
                          ? { backgroundColor: "#1C77FF", borderColor: "#1C77FF" }
                          : { borderColor: "#FFFFFF", backgroundColor: "#00000040" },
                      ]}
                    >
                      {marcados.has(item.id) ? (
                        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </Pressable>
                ) : null}
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

      <MenuOpciones
        visible={menu}
        top={8 + 56}
        onClose={() => setMenu(false)}
        opciones={[
          {
            etiqueta: "Seleccionar",
            icono: "checkmark-circle-outline",
            onPress: () => seleccion.iniciar(),
          },
          {
            etiqueta: "Seleccionar todo",
            icono: "checkbox-outline",
            onPress: () => seleccion.iniciarTodos(visibles.map((i) => i.id)),
          },
        ]}
      />
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
  check: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
