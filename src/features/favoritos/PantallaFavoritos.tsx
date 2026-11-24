import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { useScrollCabecera } from "@/components/ui/CabeceraFlotante";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { EsqueletoInicio } from "@/features/home/6-esqueleto";
import { CATEGORIES } from "@/features/marketplace/data";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { usePerfilesDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/nombreUsuario";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { CabeceraFavoritos, type Filtro } from "./1-cabecera";
import { ListaFavoritos, PREFIJO_VENDEDOR, type Bloque } from "./2-lista";
import { useVendedoresFavoritos } from "./vendedoresFavoritos";

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
/** Al quitar varios, cuántos hacen el efecto de volar al bote */
const MAX_ANIMADOS = 3;

/**
 * Favoritos (ver `README.md`), con el mismo aspecto que Notificaciones: el fondo de la app,
 * el encabezado flotante con el título, un buscador blanco (con "@" busca por quien vende) y
 * píldoras por categoría, y debajo las tarjetas de vendedor guardadas y las publicaciones con
 * la misma tarjeta del inicio.
 */
export function PantallaFavoritos() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { removeFavorites } = useMarketplaceActions();
  const { mostrar } = useAvisos();
  const { back, openProduct, openUserProfile } = useNavegacion();
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
  const perfiles = usePerfilesDe(vendedores);

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
  const vacio = useMemo(
    () => ({
      titulo: hayFiltro
        ? categoria && !busqueda.trim()
          ? `Nada de ${categoria.label.toLowerCase()}`
          : "No encontramos nada"
        : "Aún no tienes favoritos",
      mensaje: hayFiltro
        ? "Prueba con otra búsqueda o categoría."
        : "Guarda los productos que te interesan y aparecerán aquí.",
    }),
    [hayFiltro, categoria, busqueda],
  );
  // La lista empieza bajo el encabezado; abajo deja espacio para que el nav no tape la última
  const contenido = useMemo(
    () => ({
      paddingHorizontal: 16,
      paddingTop: altoCabecera + 12,
      paddingBottom: insets.bottom + 110,
    }),
    [altoCabecera, insets.bottom],
  );

  return (
    <View style={estilos.pantalla}>
      {/* Hasta medir la cabecera no se dibuja nada debajo: con el alto en 0 la carga (o la lista)
          salía desde arriba, detrás del buscador (en Android, casi un segundo) */}
      {altoCabecera === 0 ? null : loading && !hayFavoritos ? (
        // Las mismas tarjetas de carga del inicio (el `Skeleton` de HeroUI)
        <View style={[estilos.esqueleto, { paddingTop: altoCabecera + 12 }]}>
          <EsqueletoInicio cardWidth={cardWidth} />
        </View>
      ) : (
        <Animated.View
          key={filtro}
          entering={CAMBIO_FILTRO}
          style={estilos.lista}
        >
          <ListaFavoritos
            bloques={bloques}
            cardWidth={cardWidth}
            isDark={isDark}
            seleccionando={activo}
            marcados={marcados}
            registrar={registrar}
            contenido={contenido}
            alHacerScroll={alHacerScroll}
            onAlternar={seleccion.alternar}
            onOpen={openProduct}
            onOpenSeller={openUserProfile}
            onToggleFavorite={toggleFavorite}
            vacio={vacio}
          />
        </Animated.View>
      )}

      <CabeceraFavoritos
        desplazado={desplazado}
        onAlto={setAltoCabecera}
        texto={texto}
        isDark={isDark}
        seleccionando={activo}
        marcados={marcados.size}
        destinoRef={destinoRef}
        onVolver={() => conSalida(back)}
        onCancelarSeleccion={seleccion.salir}
        onEliminarMarcados={eliminar}
        onAbrirMenu={() => setMenu(true)}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        buscaPersonas={buscaPersonas}
        filtro={filtro}
        onFiltrar={setFiltro}
      />

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

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { flex: 1 },
  esqueleto: { paddingHorizontal: 16 },
});
