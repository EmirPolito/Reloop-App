import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import { AccionesPublicacion } from "@/features/marketplace/components/AccionesPublicacion";
import { ConfirmarEliminar } from "@/features/marketplace/components/ConfirmarEliminar";
import { SheetEditarPublicacion } from "@/features/marketplace/components/SheetEditarPublicacion";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { deleteProduct } from "@/features/marketplace/productRepository";
import type { Product } from "@/features/marketplace/types";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { Text } from "@/features/shared/Text";
import { describeFirestoreError } from "@/lib/firestoreValues";
import {
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoPublicaciones,
} from "../Perfiliconos";

/** Ancho de cada tarjeta (las tres miden lo mismo) respecto al ancho disponible */
const PROPORCION_TARJETA = 0.44;
/** Cuánto se separa cada tarjeta del centro, como fracción del ancho disponible */
const DESPLAZAMIENTO = 0.25;
/** Lo mismo cuando son solo dos tarjetas: quedan juntas y centradas, una a cada lado */
const DESPLAZAMIENTO_PAR = 0.4;
/** Grados que se inclina cada tarjeta de los lados */
const GIRO = 6;
/** Inclinación de cada una cuando son solo dos (simétricas, a la misma altura) */
const GIRO_PAR = 5;
/** Cuánto bajan las tarjetas de los lados */
const BAJADA = 12;
/** Cuánto se alza la tarjeta que llega al centro antes de ponerse encima de la otra */
const ALZADA = 24;
/** Alto de la parte de abajo de la tarjeta (título y precio, o los botones de acción) */
const ALTO_PIE = 60;
/** Tarjetas montadas a cada lado de la central (más lejos no se ven) */
const VENTANA = 3;
/** Resorte rápido y casi sin rebote: se puede interrumpir a mitad del cambio */
const RESORTE = { damping: 24, stiffness: 260, mass: 0.8 };
/** Las tarjetas cambian de orden de capas cuando la animación va por la mitad */
const RETRASO_CAPAS = 90;

/**
 * Publicaciones del perfil como un abanico de tarjetas iguales: la central al frente y las
 * dos de los lados inclinadas detrás. Con una sola publicación (o al llegar a un extremo) los
 * lados son tarjetas vacías para que el abanico no pierda su forma; con dos quedan juntas,
 * centradas e inclinadas, y la de la derecha es la activa. Debajo, dos flechas para pasar de
 * una a otra: la que llega se alza y se pone encima de la otra. En el perfil propio, todas
 * muestran los botones de republicar, editar (abre un drawer) y eliminar (pide
 * confirmar), y cada acción avisa arriba al terminar. Solo se animan `transform` y `opacity`;
 * el orden de capas es el del árbol.
 */
export const ListaPublicaciones = memo(function ListaPublicaciones({
  items,
  isDark,
  isOwn,
  onOpen,
}: {
  items: Product[];
  isDark: boolean;
  isOwn: boolean;
  onOpen: (productId: string) => void;
}) {
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { openUserProfile } = useAppNavigation();
  const { mostrar } = useAvisos();
  const [ancho, setAncho] = useState(0);
  const [editando, setEditando] = useState<Product | null>(null);
  const [porEliminar, setPorEliminar] = useState<Product | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const total = items.length;
  const par = total === 2;
  const [indice, setIndice] = useState(0);
  // Posición animada (decimal) de la tarjeta activa; las demás se ubican respecto a ella
  const pos = useSharedValue(0);
  // Hacia dónde va el cambio (1 = siguiente, -1 = anterior): la que llega es la que se alza
  const dir = useSharedValue(1);
  // Índice que usa el orden de capas: se actualiza a media animación
  const [frente, setFrente] = useState(0);

  // Si se elimina la última publicación, el índice no puede quedarse fuera de la lista
  const actual = Math.min(indice, Math.max(total - 1, 0));
  useEffect(() => {
    if (actual !== indice) setIndice(actual);
  }, [actual, indice]);

  // Hacia qué índice va el resorte: el toque lo arranca al instante (sin esperar al render) y
  // este efecto solo corrige cuando el índice cambia por otra razón (p. ej. se eliminó una)
  const destino = useRef(0);
  useEffect(() => {
    if (destino.current !== actual) {
      destino.current = actual;
      pos.set(withSpring(actual, RESORTE));
    }
    const t = setTimeout(() => setFrente(actual), RETRASO_CAPAS);
    return () => clearTimeout(t);
  }, [actual, pos]);

  const ir = useCallback(
    (objetivo: number) => {
      const nuevo = Math.max(0, Math.min(total - 1, objetivo));
      if (nuevo === actual) return;
      dir.set(nuevo > actual ? 1 : -1);
      destino.current = nuevo;
      pos.set(withSpring(nuevo, RESORTE));
      setIndice(nuevo);
    },
    [total, actual, dir, pos],
  );

  const cardWidth = Math.round(ancho * PROPORCION_TARJETA);
  const altoTarjeta = Math.round(cardWidth * 0.74) + ALTO_PIE;

  const eliminar = async () => {
    if (!porEliminar || eliminando) return;
    const producto = porEliminar;
    setEliminando(true);
    try {
      await deleteProduct(producto.id);
      setPorEliminar(null);
      mostrar({
        tipo: "exito",
        titulo: "Publicación eliminada",
        descripcion: `"${producto.name}" se eliminó correctamente.`,
      });
    } catch (error) {
      setPorEliminar(null);
      mostrar({
        tipo: "error",
        titulo: "No se pudo eliminar",
        descripcion: describeFirestoreError(error),
      });
    } finally {
      setEliminando(false);
    }
  };

  // Con una publicación (o al llegar a un extremo) los lados son tarjetas vacías; con dos no
  // hace falta. Las más alejadas van primero en el árbol y la que queda al frente, al final.
  const entradas: { clave: string; item: Product | null; i: number }[] =
    items.map((item, i) => ({ clave: item.id, item, i }));
  if (total > 0 && !par) {
    entradas.push({ clave: "vacio-izq", item: null, i: -1 });
    entradas.push({ clave: "vacio-der", item: null, i: total });
  }
  const visibles = entradas
    .filter(({ i }) => Math.abs(i - actual) <= VENTANA)
    .sort((a, b) => Math.abs(b.i - frente) - Math.abs(a.i - frente));

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 ? (
        <>
          <View style={{ height: altoTarjeta + ALZADA + BAJADA + 14 }}>
            {visibles.map(({ clave, item, i }) => (
              <CartaAbanico
                key={clave}
                item={item}
                indice={i}
                pos={pos}
                dir={dir}
                par={par}
                activa={i === actual}
                ancho={ancho}
                cardWidth={cardWidth}
                altoTarjeta={altoTarjeta}
                isDark={isDark}
                isOwn={isOwn}
                favorite={item ? favorites.includes(item.id) : false}
                onOpen={onOpen}
                onOpenSeller={openUserProfile}
                onToggleFavorite={toggleFavorite}
                onEditar={setEditando}
                onEliminar={setPorEliminar}
                onCentrar={ir}
              />
            ))}
          </View>

          {total > 1 ? (
            <Navegacion
              total={total}
              actual={actual}
              isDark={isDark}
              onIr={ir}
            />
          ) : null}
        </>
      ) : null}

      {isOwn ? (
        <>
          <SheetEditarPublicacion
            producto={editando}
            onClose={() => setEditando(null)}
          />
          <ConfirmarEliminar
            producto={porEliminar}
            eliminando={eliminando}
            onCancelar={() => setPorEliminar(null)}
            onConfirmar={() => void eliminar()}
          />
        </>
      ) : null}
    </View>
  );
});

/** Una tarjeta del abanico: su lugar, giro y opacidad salen de la distancia a la activa */
const CartaAbanico = memo(function CartaAbanico({
  item,
  indice,
  pos,
  dir,
  par,
  activa,
  ancho,
  cardWidth,
  altoTarjeta,
  isDark,
  isOwn,
  favorite,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
  onEditar,
  onEliminar,
  onCentrar,
}: {
  /** null = tarjeta vacía de relleno */
  item: Product | null;
  indice: number;
  pos: SharedValue<number>;
  dir: SharedValue<number>;
  par: boolean;
  activa: boolean;
  ancho: number;
  cardWidth: number;
  altoTarjeta: number;
  isDark: boolean;
  isOwn: boolean;
  favorite: boolean;
  onOpen: (productId: string) => void;
  onOpenSeller: (ownerId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onEditar: (item: Product) => void;
  onEliminar: (item: Product) => void;
  onCentrar: (indice: number) => void;
}) {
  const estilo = useAnimatedStyle(() => {
    const d = indice - pos.get();
    const a = Math.abs(d);
    // Con dos tarjetas la activa va a la derecha y la otra a la izquierda, las dos centradas
    const lado = par ? 0.5 - a : Math.max(-2, Math.min(2, d));
    const separacion = par ? DESPLAZAMIENTO_PAR : DESPLAZAMIENTO;
    // La que llega a la posición activa se alza a mitad del camino y luego baja sobre la otra
    const llegando = d * dir.get() >= 0;
    const alzada = llegando ? Math.sin(Math.PI * Math.min(a, 1)) : 0;
    return {
      opacity: par
        ? 1
        : interpolate(a, [0, 1.05, 2], [1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: lado * ancho * separacion },
        {
          // Con dos tarjetas las dos quedan a la misma altura: así el par se ve parejo
          translateY: (par ? 0 : Math.min(a, 1) * BAJADA) - alzada * ALZADA,
        },
        { rotate: `${par ? lado * 2 * GIRO_PAR : lado * GIRO}deg` },
        { scale: 1 + alzada * 0.04 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.carta,
        { width: cardWidth, left: (ancho - cardWidth) / 2 },
        estilo,
      ]}
    >
      {item ? (
        <TarjetaPublicacion
          item={item}
          cardWidth={cardWidth}
          favorite={favorite}
          onOpen={onOpen}
          onOpenSeller={onOpenSeller}
          onToggleFavorite={onToggleFavorite}
          acciones={
            isOwn ? (
              <AccionesPublicacion
                item={item}
                onEditar={onEditar}
                onEliminar={onEliminar}
              />
            ) : undefined
          }
        />
      ) : (
        <TarjetaVacia
          ancho={cardWidth}
          alto={altoTarjeta}
          isDark={isDark}
          isOwn={isOwn}
        />
      )}
      {/* Las que no están activas: tocar la foto las trae al frente */}
      {item && !activa ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver ${item.name}`}
          onPress={() => onCentrar(indice)}
          // En el perfil propio deja libres los botones: funcionan también en las de los lados
          style={[
            styles.toqueCarta,
            isOwn ? { height: altoTarjeta - ALTO_PIE } : { bottom: 0 },
          ]}
        />
      ) : null}
    </Animated.View>
  );
});

/** Tarjeta de relleno sin publicación: mismo tamaño, con un icono y un texto discretos */
function TarjetaVacia({
  ancho,
  alto,
  isDark,
  isOwn,
}: {
  ancho: number;
  alto: number;
  isDark: boolean;
  isOwn: boolean;
}) {
  const suave = isDark ? "#64748B" : "#A3A3A8";
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.vacia,
        {
          width: ancho,
          height: alto,
          backgroundColor: isDark ? "#ffffff0d" : "#F1F1F3",
          borderColor: isDark ? "#ffffff1a" : "#E4E4E7",
        },
      ]}
    >
      <IconoPublicaciones size={30} color={suave} />
      <Text style={[styles.textoVacia, { color: suave }]}>
        {isOwn ? "Tu próxima publicación" : "Sin más publicaciones"}
      </Text>
    </View>
  );
}

/** Flecha izquierda y flecha derecha */
function Navegacion({
  total,
  actual,
  isDark,
  onIr,
}: {
  total: number;
  actual: number;
  isDark: boolean;
  onIr: (destino: number) => void;
}) {
  const colorFlecha = isDark ? "#F1F5F9" : "#101010";

  return (
    <View style={styles.navegacion}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Publicación anterior"
        onPress={() => onIr(actual - 1)}
        scaleTo={0.85}
        hitSlop={12}
      >
        <IconoFlechaIzquierda size={24} color={colorFlecha} />
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Publicación siguiente"
        onPress={() => onIr(actual + 1)}
        scaleTo={0.85}
        hitSlop={12}
      >
        <IconoFlechaDerecha size={24} color={colorFlecha} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  // Todas las tarjetas parten del mismo sitio y se acomodan con `transform`; giran desde abajo
  carta: {
    position: "absolute",
    top: ALZADA + 4,
    transformOrigin: "bottom",
  },
  toqueCarta: { position: "absolute", top: 0, left: 0, right: 0 },
  navegacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 56,
    paddingTop: 4,
    paddingBottom: 6,
  },
  vacia: {
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  textoVacia: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
});
