import { Ionicons } from "@expo/vector-icons";
import { IconoEliminarLinea } from "@/features/perfil/Perfiliconos";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { Disolvible, useEliminarConEfecto } from "@/components/ui/Disolvible";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import {
  CabeceraFlotante,
  useScrollCabecera,
} from "@/components/ui/CabeceraFlotante";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import { CATEGORIES } from "@/features/marketplace/data";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import type { CategoryId, Product } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { HeartIcon } from "./components/HeartIcon";
import { CapaSeleccion } from "./CapaSeleccion";
import { TarjetaVendedorFavorita } from "./TarjetaVendedorFavorita";
import { useVendedoresFavoritos } from "./vendedoresFavoritos";

/** Todas o las de una categoría */
type Filtro = "todas" | CategoryId;

const OPCIONES: { id: Filtro; texto: string }[] = [
  { id: "todas", texto: "Todas" },
  ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
];

/** Las tarjetas de vendedor guardadas van primero; las publicaciones sueltas, de dos en dos */
type Bloque =
  | { type: "seller"; ownerId: string }
  | { type: "products"; products: Product[] };

/** En la selección, las tarjetas de vendedor llevan este prefijo (para no confundirse con una publicación) */
const PREFIJO_VENDEDOR = "v:";

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
const SEPARACION = 16;
/** Mismo círculo que los botones de Notificaciones */
const LADO_BOTON = 48;

/**
 * Favoritos, con el mismo aspecto que Notificaciones: el fondo de la app, el título al
 * centro, un buscador blanco (con "@" busca por quien vende), píldoras por categoría y las
 * publicaciones con la misma tarjeta del inicio.
 */
/** Esquinas de la tarjeta de una publicación (las de TarjetaPublicacion) */
const RADIO_PUBLICACION = 22;
/** Al quitar varios, cuántos hacen el efecto de volar al bote */
const MAX_ANIMADOS = 3;

export function PantallaFavoritos() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { removeFavorites } = useMarketplaceActions();
  const { mostrar } = useAvisos();
  const { back, openProduct, openUserProfile } = useAppNavigation();
  const cardWidth = useProductCardWidth();
  const { products, loading } = useProductsByIds(favorites);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const { desplazado, alHacerScroll, reiniciar } = useScrollCabecera();
  // Cada filtro monta la lista de nuevo, desde arriba
  useEffect(reiniciar, [filtro, reiniciar]);
  const [busqueda, setBusqueda] = useState("");
  const seleccion = useSeleccion();
  const [menu, setMenu] = useState(false);
  // Alto del encabezado flotante: la lista empieza debajo de él
  const [altoCabecera, setAltoCabecera] = useState(0);
  // Hacia el botón de quitar vuelan las tarjetas (efecto Stream)
  const { destinoRef, registrar, eliminarConEfecto } = useEliminarConEfecto();
  const { ids: vendedoresGuardados, quitar: quitarVendedores } =
    useVendedoresFavoritos();

  // Primero las publicaciones más recientes, como en el inicio
  const favoriteProducts = useMemo(
    () => [...products].sort((a, b) => b.createdAt - a.createdAt),
    [products],
  );

  // Con "@" al inicio se busca por quien vende (su usuario o su nombre)
  const modoBusqueda = modoDeBusqueda(busqueda);
  const buscaPersonas = modoBusqueda.modo === "usuarios";
  const vendedores = useMemo(
    () => [
      ...new Set([
        ...favoriteProducts.map((item) => item.ownerId),
        ...vendedoresGuardados,
      ]),
    ],
    [favoriteProducts, vendedoresGuardados],
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

  // Tarjetas de vendedor guardadas: solo con "Todas" y, si se busca, por su nombre o usuario
  const vendedoresVisibles = useMemo(() => {
    if (filtro !== "todas") return [];
    const termino = buscaPersonas
      ? modoBusqueda.termino
      : normalizarNombre(busqueda.trim());
    if (!termino) return vendedoresGuardados;
    return vendedoresGuardados.filter((id) => {
      const perfil = perfiles.get(id);
      return (
        (perfil?.username ?? "").includes(termino) ||
        normalizarNombre(perfil?.name ?? "").includes(termino)
      );
    });
  }, [
    filtro,
    buscaPersonas,
    modoBusqueda.termino,
    busqueda,
    vendedoresGuardados,
    perfiles,
  ]);

  const bloques = useMemo<Bloque[]>(() => {
    const filas: Bloque[] = vendedoresVisibles.map((ownerId) => ({
      type: "seller",
      ownerId,
    }));
    for (let i = 0; i < visibles.length; i += 2) {
      filas.push({ type: "products", products: visibles.slice(i, i + 2) });
    }
    return filas;
  }, [vendedoresVisibles, visibles]);
  const hayFavoritos =
    favoriteProducts.length > 0 || vendedoresGuardados.length > 0;

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
            // Uno solo se quita como siempre (con su aviso de siempre)
            if (ids.length === 1 && !ids[0].startsWith(PREFIJO_VENDEDOR)) {
              void eliminarConEfecto(ids, async () => toggleFavorite(ids[0]))
                .then(seleccion.salir)
                .catch((error) =>
                  showErrorAlert("No se pudieron quitar los favoritos", error),
                );
              return;
            }
            const todos =
              ids.length >=
              favoriteProducts.length + vendedoresGuardados.length;
            // Varios: todo en un lote y un solo aviso arriba (no uno por favorito)
            // Solo los primeros vuelan al bote: con muchos a la vez el efecto se trababa
            void eliminarConEfecto(
              ids,
              async () => {
                await Promise.all([
                  quitarVendedores(
                    ids
                      .filter((id) => id.startsWith(PREFIJO_VENDEDOR))
                      .map((id) => id.slice(PREFIJO_VENDEDOR.length)),
                  ),
                  removeFavorites(
                    ids.filter((id) => !id.startsWith(PREFIJO_VENDEDOR)),
                  ),
                ]);
              },
              MAX_ANIMADOS,
            )
              .then(() => {
                seleccion.salir();
                mostrar(
                  todos
                    ? {
                        tipo: "sinFavorito",
                        titulo: "Eliminaste todo",
                        descripcion: "Tu lista de favoritos quedó vacía.",
                      }
                    : {
                        tipo: "sinFavorito",
                        titulo:
                          ids.length === 1
                            ? "Eliminada de favoritos"
                            : `Eliminaste ${ids.length} favoritos`,
                        descripcion: "Ya no aparecen en tu lista de favoritos.",
                      },
                );
              })
              .catch((error) =>
                showErrorAlert("No se pudieron quitar los favoritos", error),
              );
          },
        },
      ],
    );
  };
  const hayFiltro = filtro !== "todas" || busqueda.trim() !== "";
  const categoria = CATEGORIES.find((c) => c.id === filtro);

  return (
    <View style={styles.pantalla}>
      {loading && !hayFavoritos ? (
        <View style={{ paddingTop: altoCabecera }}>
          <LoadingState />
        </View>
      ) : (
        <Animated.View
          key={filtro}
          entering={CAMBIO_FILTRO}
          style={styles.lista}
        >
          <FlatList
            onScroll={alHacerScroll}
            scrollEventThrottle={16}
            data={bloques}
            extraData={marcados}
            keyExtractor={(bloque) =>
              bloque.type === "seller"
                ? `seller-${bloque.ownerId}`
                : `products-${bloque.products[0].id}`
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: altoCabecera + 12,
              // Espacio para que la barra de navegación no tape la última publicación
              paddingBottom: insets.bottom + 110,
            }}
            renderItem={({ item: bloque }) =>
              bloque.type === "seller" ? (
                <TarjetaVendedorFavorita
                  ownerId={bloque.ownerId}
                  isDark={isDark}
                  onOpen={openProduct}
                  separacion={SEPARACION}
                  registrar={registrar}
                  seleccionando={activo}
                  marcada={marcados.has(PREFIJO_VENDEDOR + bloque.ownerId)}
                  onAlternar={() =>
                    seleccion.alternar(PREFIJO_VENDEDOR + bloque.ownerId)
                  }
                />
              ) : (
                <View style={styles.fila}>
                  {bloque.products.map((item) => (
                    <Disolvible
                      key={item.id}
                      id={item.id}
                      registrar={registrar}
                      sombra={14}
                      margenInferior={SEPARACION}
                    >
                      {/* La capa de selección cubre solo la tarjeta, no el relleno de la sombra */}
                      <View>
                        <TarjetaPublicacion
                          item={item}
                          cardWidth={cardWidth}
                          favorite
                          onOpen={openProduct}
                          onOpenSeller={openUserProfile}
                          onToggleFavorite={toggleFavorite}
                        />
                        {activo ? (
                          <CapaSeleccion
                            radio={RADIO_PUBLICACION}
                            etiqueta={`Seleccionar ${item.name}`}
                            marcada={marcados.has(item.id)}
                            onPress={() => seleccion.alternar(item.id)}
                          />
                        ) : null}
                      </View>
                    </Disolvible>
                  ))}
                </View>
              )
            }
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

      {/* Encabezado flotante, sin tarjeta de fondo: la lista pasa por detrás */}
      <CabeceraFlotante
        paddingTop={8}
        desplazado={desplazado}
        onAlto={setAltoCabecera}
      >
        {/* Volver a la izquierda, el título al centro y la campana a la derecha */}
        <View style={styles.barra}>
          {activo ? (
            <BotonBarra etiqueta="Cancelar selección" onPress={seleccion.salir}>
              <Ionicons name="close" size={26} color={texto} />
            </BotonBarra>
          ) : (
            <BotonBarra etiqueta="Volver" onPress={() => conSalida(back)}>
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
            // Destino del efecto: hacia aquí vuelan las tarjetas quitadas
            <View ref={destinoRef} collapsable={false}>
              <BotonBarra
                etiqueta="Quitar favoritos seleccionados"
                // Con algo marcado: fondo rojo e icono blanco
                peligro={marcados.size > 0}
                colorPeligro="#EF4444"
                // Sin nada elegido se ve blanco (no apagado) y no hace nada
                onPress={eliminar}
              >
                <IconoEliminarLinea
                  size={26}
                  color={marcados.size > 0 ? "#FFFFFF" : texto}
                />
              </BotonBarra>
            </View>
          ) : (
            // Siempre blanco, haya o no favoritos (sin favoritos, la opción del menú se apaga)
            <BotonBarra
              etiqueta="Eliminar favoritos"
              onPress={() => setMenu(true)}
            >
              <IconoEliminarLinea
                size={26}
                color={isDark ? "#FFFFFF" : texto}
              />
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

        <FiltrosPildoras
          opciones={OPCIONES}
          activo={filtro}
          onCambiar={setFiltro}
        />
      </CabeceraFlotante>

      <MenuOpciones
        visible={menu}
        // La pestaña empieza bajo la barra de estado; el menú se mide desde arriba de la ventana
        top={insets.top + 8 + 56}
        onClose={() => setMenu(false)}
        opciones={[
          {
            etiqueta: "Seleccionar todo",
            icono: "checkbox-outline",
            deshabilitada: vendedoresVisibles.length + visibles.length === 0,
            onPress: () =>
              seleccion.iniciarTodos([
                ...vendedoresVisibles.map((id) => PREFIJO_VENDEDOR + id),
                ...visibles.map((i) => i.id),
              ]),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
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
  // Dos publicaciones sueltas lado a lado
  fila: { flexDirection: "row", gap: SEPARACION },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
