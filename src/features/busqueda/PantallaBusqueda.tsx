import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Keyboard, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "expo-router";
import Animated, {
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { conSalida, registrarSalida } from "@/components/salidaModulo";
import { TRANSICION_MODULO } from "@/constants/motion";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { filterProducts } from "@/features/marketplace/feedFilters";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import type { CategoryId } from "@/features/marketplace/types";
import { UNIVERSIDAD_PROPIA } from "@/features/marketplace/universidades";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { TextInput } from "@/features/shared/Text";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { CabeceraBusqueda } from "./1-cabecera";
import { VistaSinTexto } from "./2-sin-texto";
import { enFilas, VistaResultados } from "./3-resultados";
import { VistaPersonas } from "./4-personas";
import { estilos, useColoresBusqueda } from "./estilos";
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

/**
 * Módulo de búsqueda (ver `README.md`): se abre al tocar la lupa del inicio. Arriba flota la
 * cabecera con volver y el buscador; debajo, una de tres vistas: sin texto (recientes e
 * ideas), resultados de publicaciones o personas (si el texto empieza con "@").
 */
export function PantallaBusqueda() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const colores = useColoresBusqueda();
  const { back, openProduct, openUserProfile } = useNavegacion();
  const { products: todos, favorites, universidad } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const cardWidth = useProductCardWidth(2);
  const { recientes, agregar, quitar } = useBusquedasRecientes();

  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<CategoryId | null>(null);
  const [altoCabecera, setAltoCabecera] = useState(0);
  // Escribir no espera a que se filtre la lista
  const consulta = useDeferredValue(texto);
  // Los botones leen el texto actual sin volver a crearse en cada letra (si no, cada tecla
  // redibujaba todas las tarjetas de resultados)
  const textoRef = useLatestRef(texto);

  const entradaRef = useRef<ComponentRef<typeof TextInput>>(null);
  const progreso = useSharedValue(0);
  // El teclado sube cuando el módulo ya entró: los dos movimientos juntos se ven bruscos.
  // Solo la primera vez: al volver de una publicación se quedan los resultados sin teclado
  const yaEnfocado = useRef(false);
  const enfocar = useCallback(() => {
    if (yaEnfocado.current) return;
    yaEnfocado.current = true;
    entradaRef.current?.focus();
  }, []);
  // Como los demás módulos: entra cada vez que recibe el foco y registra su salida, para que
  // salga animado antes de navegar fuera
  useFocusEffect(
    useCallback(() => {
      progreso.set(
        withTiming(1, ENTRADA, (terminado) => {
          if (terminado) scheduleOnRN(enfocar);
        }),
      );
      const quitarSalida = registrarSalida((despues) => {
        Keyboard.dismiss();
        progreso.set(
          withTiming(0, SALIDA, (terminado) => {
            if (terminado) scheduleOnRN(despues);
          }),
        );
      });
      return () => {
        quitarSalida();
        progreso.set(0);
      };
    }, [progreso, enfocar]),
  );
  const estilo = useAnimatedStyle(() => ({
    opacity: progreso.get(),
    transform: [{ translateY: (1 - progreso.get()) * DESPLAZAMIENTO }],
  }));

  // Las mismas publicaciones que el inicio: las de la universidad elegida
  const products = useMemo(
    () =>
      todos.filter(
        (product) =>
          (product.universidad ?? UNIVERSIDAD_PROPIA) === universidad,
      ),
    [todos, universidad],
  );
  // Buscar en un Set es directo (en el arreglo había que recorrerlo por cada tarjeta)
  const favoritos = useMemo(() => new Set(favorites), [favorites]);

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
      agregar(textoRef.current);
      conSalida(() => openProduct(productId));
    },
    [agregar, textoRef, openProduct],
  );
  const abrirPersona = useCallback(
    (uid: string) => {
      agregar(textoRef.current);
      conSalida(() => openUserProfile(uid));
    },
    [agregar, textoRef, openUserProfile],
  );
  // Al elegir una reciente ya no hace falta el teclado: se ven los resultados
  const elegirTexto = useCallback(
    (elegido: string) => {
      Keyboard.dismiss();
      setTexto(elegido);
      agregar(elegido);
    },
    [agregar],
  );
  // Solo "@" (buscar personas) deja el teclado abierto para escribir el usuario
  const elegirIdea = useCallback((busquedaIdea: string) => {
    if (busquedaIdea !== "@") Keyboard.dismiss();
    setTexto(busquedaIdea);
  }, []);
  const enviar = useCallback(
    () => agregar(textoRef.current),
    [agregar, textoRef],
  );
  // Volver: desde los resultados (o personas) regresa a la vista sin texto; desde ahí, cierra
  const volver = useCallback(() => {
    if (texto !== "" || categoria !== null) {
      Keyboard.dismiss();
      setTexto("");
      setCategoria(null);
    } else {
      conSalida(back);
    }
  }, [texto, categoria, back]);
  const alternarCategoria = useCallback(
    (id: CategoryId) => setCategoria((actual) => (actual === id ? null : id)),
    [],
  );
  const alMedirCabecera = useCallback(
    (event: LayoutChangeEvent) =>
      setAltoCabecera(event.nativeEvent.layout.height),
    [],
  );

  // Scroll de la vista de abajo: la neblina de la cabecera aparece al desplazarse
  const desplazado = useSharedValue(0);
  const alHacerScroll = useAnimatedScrollHandler((event) => {
    desplazado.set(event.contentOffset.y);
  });
  const vista = buscaUsuarios
    ? "personas"
    : conResultados
      ? "resultados"
      : "sinTexto";
  useEffect(() => {
    desplazado.set(0);
  }, [vista, desplazado]);

  // El contenido pasa por detrás de la cabecera flotante; en reposo empieza debajo de ella
  const contenido = useMemo(
    () => [
      estilos.contenido,
      { paddingTop: altoCabecera + 12, paddingBottom: insets.bottom + 24 },
    ],
    [altoCabecera, insets.bottom],
  );

  return (
    <Animated.View
      style={[estilos.pantalla, { backgroundColor: colores.fondo }, estilo]}
    >
      {/* Cada vista entra y sale con la transición de los módulos; al abrir el módulo ya
          entra con él, sin repetirla */}
      <LayoutAnimationConfig skipEntering>
        <Animated.View
          key={vista}
          entering={ENTRADA_VISTA}
          exiting={SALIDA_VISTA}
          style={StyleSheet.absoluteFill}
        >
          {vista === "personas" ? (
            <VistaPersonas
              termino={busqueda.termino}
              isDark={isDark}
              contenido={contenido}
              alHacerScroll={alHacerScroll}
              onOpenUser={abrirPersona}
            />
          ) : vista === "resultados" ? (
            <VistaResultados
              filas={filas}
              cardWidth={cardWidth}
              favoritos={favoritos}
              contenido={contenido}
              alHacerScroll={alHacerScroll}
              onOpen={abrirProducto}
              onOpenSeller={abrirPersona}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <VistaSinTexto
              recientes={recientes}
              colores={colores}
              contenido={contenido}
              alHacerScroll={alHacerScroll}
              onElegirReciente={elegirTexto}
              onElegirIdea={elegirIdea}
              onQuitarReciente={quitar}
            />
          )}
        </Animated.View>
      </LayoutAnimationConfig>

      <CabeceraBusqueda
        texto={texto}
        onCambiarTexto={setTexto}
        onEnviar={enviar}
        entradaRef={entradaRef}
        colores={colores}
        buscaUsuarios={buscaUsuarios}
        conResultados={conResultados}
        categoria={categoria}
        onAlternarCategoria={alternarCategoria}
        onVolver={volver}
        altoCabecera={altoCabecera}
        onMedir={alMedirCabecera}
        desplazado={desplazado}
      />
    </Animated.View>
  );
}
