import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useDissolve } from "dissolve-ui";
import Animated, {
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { PressableScale } from "@/components/PressableScale";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { BulkSearchIcon } from "@/features/chats/components/ChatIcons";
import { MARGEN_FIJO } from "@/features/home/components/BuscadorFlotante";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { CATEGORIES } from "@/features/marketplace/data";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import type { CategoryId, Product } from "@/features/marketplace/types";
import { UNIVERSIDAD_PROPIA } from "@/features/marketplace/universidades";
import { TRANSICION_MODULO } from "@/constants/motion";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { APP_BACKGROUND } from "@/features/shared/constants";
import { Text, TextInput } from "@/features/shared/Text";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { COLA_NEBLINA, Neblina } from "./components/Neblina";
import {
  ALTO_PILDORA,
  GROSOR_LUPA,
  PildoraCristal,
} from "./components/PildoraCristal";
import { FilaPildoras, PildoraOpcion } from "./components/PildoraOpcion";
import { ResultadosUsuarios } from "./components/ResultadosUsuarios";
import {
  ETIQUETA_BUSQUEDA,
  IDEAS_BUSQUEDA,
  PISTA_BUSQUEDA,
  SUGERENCIAS_BUSQUEDA,
} from "./frasesBusqueda";
import { useBusquedasRecientes } from "./hooks/useBusquedasRecientes";
import { modoDeBusqueda } from "./modoBusqueda";

/** Entrada y salida: las mismas de los demás módulos */
const { entrada: ENTRADA, salida: SALIDA } = TRANSICION_MODULO;
const DESPLAZAMIENTO = TRANSICION_MODULO.desplazamiento;
/** Al cambiar de vista dentro del módulo: la misma entrada y salida */
const ENTRADA_VISTA = FadeInDown.duration(ENTRADA.duration)
  .easing(ENTRADA.easing)
  .withInitialValues({
    opacity: 0,
    transform: [{ translateY: DESPLAZAMIENTO }],
  });
const SALIDA_VISTA = FadeOut.duration(SALIDA.duration).easing(SALIDA.easing);
/** Las recientes que quedan se acomodan suave cuando una se va */
const ACOMODO = LinearTransition.duration(240).easing(ENTRADA.easing);
/** Scroll en el que la neblina termina de aparecer */
const TRAMO_NEBLINA = 24;
/** Botón de volver: del alto del buscador, sin pasarlo */
const LADO_VOLVER = ALTO_PILDORA;

/** Fila de dos publicaciones (la cuadrícula del inicio) */
type FilaResultados = { key: string; products: Product[] };

function enFilas(products: Product[]): FilaResultados[] {
  const filas: FilaResultados[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const par = products.slice(i, i + 2);
    filas.push({
      key: par.map((product) => product.id).join(":"),
      products: par,
    });
  }
  return filas;
}

/**
 * Módulo de búsqueda: se abre al tocar el buscador del inicio. Arriba flotan el botón de
 * volver y la misma píldora de cristal (con el teclado abierto), sobre una neblina que
 * difumina lo que pasa por detrás. Sin texto: ideas de qué buscar y las búsquedas recientes.
 * Al escribir: píldoras de categorías y los resultados en vivo con la tarjeta de publicación
 * del inicio (o personas, si el texto empieza con "@").
 */
export function ModuloBusqueda() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back, openProduct, openUserProfile } = useAppNavigation();
  const { products: todos, favorites, universidad } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const cardWidth = useProductCardWidth(2);
  const { recientes, agregar, quitar } = useBusquedasRecientes();

  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<CategoryId | null>(null);
  const [altoCabecera, setAltoCabecera] = useState(0);
  // Escribir no espera a que se filtre la lista
  const consulta = useDeferredValue(texto);

  const colores = useMemo(
    () =>
      isDark
        ? {
            fondo: APP_BACKGROUND.dark,
            texto: "#F1F5F9",
            suave: "#94A3B8",
            caja: "rgba(255,255,255,0.08)",
          }
        : {
            fondo: APP_BACKGROUND.light,
            texto: "#101010",
            suave: "#828690",
            caja: "#F4F4F4",
          },
    [isDark],
  );

  const entradaRef = useRef<ComponentRef<typeof TextInput>>(null);
  const progreso = useSharedValue(0);
  // El teclado sube cuando el módulo ya entró: los dos movimientos juntos se ven bruscos
  const enfocar = useCallback(() => entradaRef.current?.focus(), []);
  useEffect(() => {
    progreso.set(
      withTiming(1, ENTRADA, (terminado) => {
        if (terminado) scheduleOnRN(enfocar);
      }),
    );
  }, [progreso, enfocar]);
  const estilo = useAnimatedStyle(() => ({
    opacity: progreso.get(),
    transform: [{ translateY: (1 - progreso.get()) * DESPLAZAMIENTO }],
  }));

  const cerrar = useCallback(() => {
    Keyboard.dismiss();
    progreso.set(
      withTiming(0, SALIDA, (terminado) => {
        if (terminado) scheduleOnRN(back);
      }),
    );
  }, [progreso, back]);

  // Las mismas publicaciones que el inicio: las de la universidad elegida
  const products = useMemo(
    () =>
      todos.filter(
        (product) =>
          (product.universidad ?? UNIVERSIDAD_PROPIA) === universidad,
      ),
    [todos, universidad],
  );

  const busqueda = modoDeBusqueda(consulta);
  const buscaUsuarios = busqueda.modo === "usuarios";
  const conResultados = consulta.trim() !== "" || categoria !== null;
  const filas = useMemo(
    () =>
      conResultados && !buscaUsuarios
        ? enFilas(
            filterProducts(products, { query: consulta, category: categoria }),
          )
        : [],
    [conResultados, buscaUsuarios, products, consulta, categoria],
  );

  const abrirProducto = useCallback(
    (productId: string) => {
      agregar(texto);
      openProduct(productId);
    },
    [agregar, texto, openProduct],
  );
  const abrirPersona = useCallback(
    (uid: string) => {
      agregar(texto);
      openUserProfile(uid);
    },
    [agregar, texto, openUserProfile],
  );
  // Al elegir una reciente, idea o sugerencia ya no hace falta el teclado: se ven los
  // resultados. Solo "@" (buscar personas) lo deja abierto para escribir el usuario
  const elegirTexto = useCallback(
    (elegido: string) => {
      Keyboard.dismiss();
      setTexto(elegido);
      agregar(elegido);
    },
    [agregar],
  );
  const elegirIdea = useCallback((busquedaIdea: string) => {
    if (busquedaIdea !== "@") Keyboard.dismiss();
    setTexto(busquedaIdea);
  }, []);
  // Volver: desde los resultados (o personas) regresa a la vista inicial del módulo; desde
  // ahí, cierra el módulo
  const volver = useCallback(() => {
    if (texto !== "" || categoria !== null) {
      Keyboard.dismiss();
      setTexto("");
      setCategoria(null);
    } else {
      cerrar();
    }
  }, [texto, categoria, cerrar]);
  const alternarCategoria = useCallback(
    (id: CategoryId) => setCategoria((actual) => (actual === id ? null : id)),
    [],
  );
  const alMedirCabecera = useCallback(
    (event: LayoutChangeEvent) =>
      setAltoCabecera(event.nativeEvent.layout.height),
    [],
  );

  const renderFila = useCallback(
    ({ item }: { item: FilaResultados }) => (
      <View style={styles.filaProductos}>
        {item.products.map((product) => (
          <TarjetaPublicacion
            key={product.id}
            item={product}
            cardWidth={cardWidth}
            favorite={favorites.includes(product.id)}
            onOpen={abrirProducto}
            onOpenSeller={abrirPersona}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </View>
    ),
    [cardWidth, favorites, abrirProducto, abrirPersona, toggleFavorite],
  );

  // La neblina solo aparece cuando hay contenido pasando por detrás de la cabecera: en reposo,
  // un degradado blanco sobre el fondo blanco dejaba un tono distinto bajo las píldoras
  const desplazado = useSharedValue(0);
  const alHacerScroll = useAnimatedScrollHandler((event) => {
    desplazado.set(event.contentOffset.y);
  });
  const vista = buscaUsuarios
    ? "personas"
    : conResultados
      ? "resultados"
      : "inicio";
  useEffect(() => {
    desplazado.set(0);
  }, [vista, desplazado]);
  // La neblina va por capas desde el buscador hasta un poco debajo de las píldoras (fila de
  // 8 + 40 + 8 bajo el buscador); sin píldoras, un poco debajo del buscador
  const altoNeblina = altoCabecera + (buscaUsuarios ? 16 : COLA_NEBLINA - 8);
  const finBuscador = altoCabecera - (buscaUsuarios ? 0 : 56);
  const corteNeblina = altoCabecera > 0 ? finBuscador / altoNeblina : undefined;
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(desplazado.get() / TRAMO_NEBLINA, 0), 1),
  }));

  // El contenido pasa por detrás de la cabecera flotante; en reposo empieza debajo de ella
  const contenido = [
    styles.contenido,
    { paddingTop: altoCabecera + 12, paddingBottom: insets.bottom + 24 },
  ];

  return (
    <Animated.View
      style={[styles.pantalla, { backgroundColor: colores.fondo }, estilo]}
    >
      {/* Cada vista (ideas y recientes, resultados, personas) entra y sale con la transición
          de los módulos; al abrir el módulo ya entra con él, sin repetirla */}
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={vista}
          entering={ENTRADA_VISTA}
          exiting={SALIDA_VISTA}
          style={StyleSheet.absoluteFill}
        >
          {buscaUsuarios ? (
            <Animated.ScrollView
              style={styles.lista}
              contentContainerStyle={contenido}
              onScroll={alHacerScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <ResultadosUsuarios
                termino={busqueda.termino}
                isDark={isDark}
                onOpenUser={abrirPersona}
              />
            </Animated.ScrollView>
          ) : conResultados ? (
            <Animated.FlatList
              style={styles.lista}
              contentContainerStyle={contenido}
              onScroll={alHacerScroll}
              scrollEventThrottle={16}
              data={filas}
              keyExtractor={(fila) => fila.key}
              renderItem={renderFila}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={7}
              ListEmptyComponent={
                // Sin tarjeta, como en chats y favoritos
                <IllustratedEmptyState
                  icon={<BulkSearchIcon size={80} />}
                  title="No encontramos publicaciones"
                  message="Prueba con otra palabra o quita el filtro de categoría."
                  conInter
                  style={styles.vacio}
                />
              }
            />
          ) : (
            <Animated.ScrollView
              style={styles.lista}
              contentContainerStyle={contenido}
              onScroll={alHacerScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {recientes.length > 0 ? (
                <View>
                  <Text
                    style={[styles.tituloSeccion, { color: colores.suave }]}
                  >
                    Búsquedas recientes
                  </Text>
                  {recientes.map((reciente) => (
                    <FilaReciente
                      key={reciente}
                      texto={reciente}
                      colores={colores}
                      onElegir={elegirTexto}
                      onQuitar={quitar}
                    />
                  ))}
                </View>
              ) : null}
              <View
                style={recientes.length > 0 ? styles.seccionSiguiente : null}
              >
                <Text style={[styles.tituloSeccion, { color: colores.suave }]}>
                  Ideas para buscar
                </Text>
                {IDEAS_BUSQUEDA.map((idea) => (
                  <FilaIdea
                    key={idea.titulo}
                    busqueda={idea.busqueda}
                    titulo={idea.titulo}
                    detalle={idea.detalle}
                    colores={colores}
                    onElegir={elegirIdea}
                  />
                ))}
              </View>
            </Animated.ScrollView>
          )}
        </Animated.View>
      </LayoutAnimationConfig>

      {/* Cabecera flotante: sin tarjeta, solo una neblina que se desvanece hacia abajo */}
      <View
        pointerEvents="box-none"
        style={styles.cabecera}
        onLayout={alMedirCabecera}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.neblina,
            { bottom: -(altoNeblina - altoCabecera) },
            estiloNeblina,
          ]}
        >
          <Neblina style={StyleSheet.absoluteFill} corte={corteNeblina} />
        </Animated.View>
        <View
          style={[
            styles.filaBuscador,
            { paddingTop: insets.top + MARGEN_FIJO },
          ]}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Volver"
            scaleTo={0.96}
            onPress={volver}
          >
            <PildoraCristal contentStyle={styles.circulo}>
              <AppIcon name="back" size={22} color={colores.texto} />
            </PildoraCristal>
          </PressableScale>
          <PildoraCristal style={styles.pildora}>
            <IconoBusqueda
              size={22}
              color={isDark ? "#E3DEED" : "#4A4D57"}
              grosorExtra={GROSOR_LUPA}
            />
            <TextInput
              ref={entradaRef}
              accessibilityLabel={ETIQUETA_BUSQUEDA}
              accessibilityHint={PISTA_BUSQUEDA}
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={() => agregar(texto)}
              placeholder="Buscar"
              placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
              autoCapitalize="none"
              autoCorrect={!buscaUsuarios}
              returnKeyType="search"
              style={[styles.entrada, { color: colores.texto }]}
            />
            {texto ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Borrar texto"
                hitSlop={10}
                onPress={() => setTexto("")}
                style={[
                  styles.limpiar,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(0,0,0,0.12)",
                  },
                ]}
              >
                <AppIcon name="close" size={11} color={colores.texto} />
              </PressableScale>
            ) : null}
          </PildoraCristal>
        </View>

        {buscaUsuarios ? null : (
          <FilaPildoras>
            {conResultados
              ? CATEGORIES.map((category) => (
                  <PildoraOpcion
                    key={category.id}
                    valor={category.id}
                    etiqueta={category.label}
                    seleccionado={categoria === category.id}
                    isDark={isDark}
                    onPress={alternarCategoria}
                    sutil
                  />
                ))
              : SUGERENCIAS_BUSQUEDA.map((sugerencia) => (
                  <PildoraOpcion
                    key={sugerencia}
                    valor={sugerencia}
                    etiqueta={sugerencia}
                    seleccionado={false}
                    isDark={isDark}
                    onPress={elegirTexto}
                  />
                ))}
          </FilaPildoras>
        )}
      </View>
    </Animated.View>
  );
}

/** Idea de búsqueda con una línea de descripción; tocarla la escribe en el buscador */
const FilaIdea = memo(function FilaIdea({
  busqueda,
  titulo,
  detalle,
  colores,
  onElegir,
}: {
  busqueda: string;
  titulo: string;
  detalle: string;
  colores: { texto: string; suave: string; caja: string };
  onElegir: (texto: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${detalle}`}
      onPress={() => onElegir(busqueda)}
      style={styles.filaReciente}
    >
      <View style={[styles.recienteIcono, { backgroundColor: colores.caja }]}>
        <IconoBusqueda
          size={20}
          color={colores.texto}
          grosorExtra={GROSOR_LUPA}
        />
      </View>
      <View style={styles.ideaTextos}>
        <Text
          numberOfLines={1}
          style={[styles.ideaTitulo, { color: colores.texto }]}
        >
          {titulo}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.ideaDetalle, { color: colores.suave }]}
        >
          {detalle}
        </Text>
      </View>
      <AppIcon name="chevronRight" size={14} color={colores.suave} />
    </Pressable>
  );
});

/**
 * Búsqueda reciente. Al quitarla se vuelve polvo que el viento se lleva (efecto Dust de
 * dissolve-ui, desde la izquierda); cuando ya no ocupa su lugar se quita de verdad y las demás
 * suben suave. La fila sigue oculta hasta que se quita, así no parpadea.
 */
const FilaReciente = memo(function FilaReciente({
  texto,
  colores,
  onElegir,
  onQuitar,
}: {
  texto: string;
  colores: { texto: string; suave: string; caja: string };
  onElegir: (texto: string) => void;
  onQuitar: (texto: string) => void;
}) {
  const { ref, dissolving, dissolve } = useDissolve();
  const [quitando, setQuitando] = useState(false);

  const quitarConPolvo = async () => {
    if (quitando) return;
    setQuitando(true);
    try {
      await dissolve({ preset: "dust", grain: 3, duration: 1500 });
    } catch {
      // El efecto es solo visual (en la web no puede capturar la fila): se quita igual
    }
    onQuitar(texto);
  };

  return (
    <Animated.View layout={ACOMODO}>
      <View
        // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
        ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
        collapsable={false}
        style={[styles.filaReciente, { opacity: dissolving ? 0 : 1 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buscar ${texto}`}
          onPress={() => onElegir(texto)}
          style={styles.recienteTexto}
        >
          <View
            style={[styles.recienteIcono, { backgroundColor: colores.caja }]}
          >
            <IconoBusqueda
              size={20}
              color={colores.texto}
              grosorExtra={GROSOR_LUPA}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.reciente, { color: colores.texto }]}
          >
            {texto}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${texto} de las recientes`}
          hitSlop={12}
          onPress={quitarConPolvo}
          style={[styles.quitar, { backgroundColor: colores.suave }]}
        >
          <AppIcon name="close" size={9} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  vacio: { paddingTop: 70, paddingBottom: 140 },
  lista: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  contenido: { paddingHorizontal: 16 },
  cabecera: { position: "absolute", top: 0, left: 0, right: 0 },
  neblina: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  filaBuscador: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  circulo: {
    width: LADO_VOLVER,
    height: LADO_VOLVER,
    minHeight: LADO_VOLVER,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  pildora: { flex: 1 },
  // Sin padding vertical: la píldora mide lo mismo que la del inicio (con él crecía a 52)
  entrada: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    // La misma letra que el texto del buscador del inicio
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  limpiar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloSeccion: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 10,
  },
  filaReciente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  recienteTexto: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  recienteIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reciente: { flex: 1, fontSize: 15, fontWeight: "400" },
  ideaTextos: { flex: 1, minWidth: 0, gap: 2 },
  ideaTitulo: { fontSize: 15, fontWeight: "400" },
  ideaDetalle: { fontSize: 13, fontWeight: "400" },
  seccionSiguiente: { marginTop: 22 },
  quitar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  filaProductos: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
    marginBottom: 16,
  },
});
