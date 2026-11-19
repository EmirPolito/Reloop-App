import { memo, useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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
import { formatProductPrice } from "@/features/marketplace/rules";
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
const PROPORCION_TARJETA = 0.4;
/** Cuánto se separa cada tarjeta del centro, como fracción del ancho disponible */
const DESPLAZAMIENTO = 0.14;
/** Grados que se inclina cada tarjeta de los lados */
const GIRO = 13;
/** Cuánto bajan las tarjetas de los lados */
const BAJADA = 12;
/** Cuánto se alza la tarjeta que llega al centro antes de ponerse encima de la otra */
const ALZADA = 24;
/** Alto de la parte de abajo de la tarjeta (los botones de acción o el título y el precio) */
const ALTO_PIE = 60;
/** Lugares a cada lado del central que tienen tarjeta (más lejos no se ven) */
const VENTANA = 3;
/** Tarjetas que existen siempre: se reutilizan, nunca se montan ni se desmontan al cambiar */
const TARJETAS = VENTANA * 2 + 1;
/** Resorte rápido y casi sin rebote: se puede interrumpir a mitad del cambio */
const RESORTE = { damping: 24, stiffness: 260, mass: 0.8 };
/** Las tarjetas cambian de orden de capas cuando la animación va por la mitad */
const RETRASO_CAPAS = 90;
const MAX_PUNTOS = 3;
/** El carrusel siempre tiene al menos 3 lugares: los que faltan son tarjetas grises */
const LUGARES_MIN = 3;
const LADO_PUNTO = 6;

/** Módulo que no se vuelve negativo (el carrusel gira en los dos sentidos) */
function modulo(n: number, m: number) {
  "worklet";
  return ((n % m) + m) % m;
}

/** Siguiente lugar del carrusel, en ese sentido, que tenga una publicación (salta los grises) */
function lugarConPublicacion(desde: number, sentido: number, total: number) {
  const largo = Math.max(total, LUGARES_MIN);
  for (let paso = 1; paso <= largo; paso++) {
    const k = desde + sentido * paso;
    if (modulo(k, largo) < total) return k;
  }
  return desde;
}

/**
 * Publicaciones del perfil como un abanico infinito de tarjetas iguales: la central al frente
 * y las dos de los lados inclinadas detrás. Las flechas giran sin fin: después de la última
 * vuelve la primera. Si hay menos de tres publicaciones, los lugares que faltan son tarjetas
 * grises con un icono y un texto (nunca se repite una publicación) y las flechas los saltan.
 * Cada tarjeta es un lugar del carrusel (0, 1, 2, 3...) que muestra la publicación
 * lugar % lugares, y cada lugar se anima por su cuenta; la que llega se alza y se pone
 * encima de la otra. En el perfil propio todas muestran los botones de republicar, editar
 * (abre un drawer) y eliminar (pide confirmar), y cada acción avisa arriba al terminar. Solo
 * se animan transform y opacity. Hay siempre las mismas 7 tarjetas: al avanzar, la que queda
 * más lejos (invisible) salta al otro extremo con otra publicación, así que cambiar no monta
 * ni desmonta nada y no hay tirones.
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
  // Lugar del carrusel que está al centro (sin tope: puede ser negativo o mayor que `total`)
  const [lugar, setLugar] = useState(0);
  // Posición animada (decimal) del lugar central; las tarjetas se ubican respecto a ella
  const pos = useSharedValue(0);
  // Hacia dónde va el cambio (1 = siguiente, -1 = anterior), con transición suave: la que llega es
  // la que se alza, y al invertir el sentido a mitad la alzada se reparte sin saltos
  const dir = useSharedValue(1);
  // Lugar que usa el orden de capas: se actualiza a media animación
  const [frente, setFrente] = useState(0);

  const lugaresCiclo = Math.max(total, LUGARES_MIN);

  useEffect(() => {
    const t = setTimeout(() => setFrente(lugar), RETRASO_CAPAS);
    return () => clearTimeout(t);
  }, [lugar]);

  // El resorte arranca en el mismo toque, sin esperar al render
  const ir = useCallback(
    (destino: number) => {
      if (destino === lugar) return;
      dir.set(withTiming(destino > lugar ? 1 : -1, { duration: 140 }));
      pos.set(withSpring(destino, RESORTE));
      setLugar(destino);
    },
    [lugar, dir, pos],
  );
  const paso = useCallback(
    (sentido: number) => ir(lugarConPublicacion(lugar, sentido, total)),
    [ir, lugar, total],
  );

  // Si al eliminar una publicación el lugar central queda gris, pasa al siguiente con publicación
  useEffect(() => {
    if (total > 0 && modulo(lugar, lugaresCiclo) >= total) {
      const destino = lugarConPublicacion(lugar, 1, total);
      dir.set(withTiming(1, { duration: 140 }));
      pos.set(withSpring(destino, RESORTE));
      setLugar(destino);
    }
  }, [total, lugar, lugaresCiclo, dir, pos]);

  const cardWidth = Math.round(ancho * PROPORCION_TARJETA);
  const altoTarjeta = 64 + cardWidth + ALTO_PIE;

  const eliminar = async () => {
    if (!porEliminar || eliminando) return;
    const producto = porEliminar;
    setEliminando(true);
    try {
      await deleteProduct(producto.id);
      setPorEliminar(null);
      mostrar({
        tipo: "eliminada",
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

  // Cada tarjeta (0..6) muestra siempre el lugar del carrusel que es igual a ella módulo 7 y
  // está dentro de la ventana del central. Su orden en el árbol no cambia; las capas se ordenan
  // con zIndex fijo (la más cercana a `frente` queda arriba), sin animar el zIndex.
  const tarjetas = Array.from({ length: TARJETAS }, (_, indice) => ({
    indice,
    k: lugar + modulo(indice - lugar + VENTANA, TARJETAS) - VENTANA,
  }));

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 && total > 0 ? (
        <>
          <View style={{ height: altoTarjeta + ALZADA + BAJADA + 14 }}>
            {tarjetas.map(({ indice, k }) => {
              // Pasados los primeros `total` lugares del ciclo no hay publicación: tarjeta gris
              const item = items[modulo(k, lugaresCiclo)] ?? null;
              return (
                <CartaAbanico
                  key={indice}
                  capa={20 - Math.min(Math.abs(k - frente), 19)}
                  item={item}
                  lugar={k}
                  pos={pos}
                  dir={dir}
                  activa={k === lugar}
                  ancho={ancho}
                  cardWidth={cardWidth}
                  altoTarjeta={altoTarjeta}
                  isOwn={isOwn}
                  isDark={isDark}
                  favorite={item ? favorites.includes(item.id) : false}
                  onOpen={onOpen}
                  onOpenSeller={openUserProfile}
                  onToggleFavorite={toggleFavorite}
                  onEditar={setEditando}
                  onEliminar={setPorEliminar}
                  onCentrar={ir}
                />
              );
            })}
          </View>

          {total > 1 ? (
            <Navegacion
              puntos={MAX_PUNTOS}
              pos={pos}
              isDark={isDark}
              onPaso={paso}
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

/** Un lugar del abanico: su sitio, giro y opacidad salen de la distancia al lugar central */
const CartaAbanico = memo(function CartaAbanico({
  capa,
  item,
  lugar,
  pos,
  dir,
  activa,
  ancho,
  cardWidth,
  altoTarjeta,
  isOwn,
  isDark,
  favorite,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
  onEditar,
  onEliminar,
  onCentrar,
}: {
  /** Orden de capas (zIndex): la que está al frente tiene el valor más alto */
  capa: number;
  /** null = tarjeta gris de relleno */
  item: Product | null;
  lugar: number;
  pos: SharedValue<number>;
  dir: SharedValue<number>;
  activa: boolean;
  ancho: number;
  cardWidth: number;
  altoTarjeta: number;
  isOwn: boolean;
  isDark: boolean;
  favorite: boolean;
  onOpen: (productId: string) => void;
  onOpenSeller: (ownerId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onEditar: (item: Product) => void;
  onEliminar: (item: Product) => void;
  onCentrar: (lugar: number) => void;
}) {
  const estilo = useAnimatedStyle(() => {
    const d = lugar - pos.get();
    const a = Math.abs(d);
    const lado = Math.max(-2, Math.min(2, d));
    // Las que están lejos dejan de girar mientras se desvanecen
    const giro = Math.max(-1, Math.min(1, d));
    // La que llega al centro se alza a mitad del camino y luego baja sobre la otra; el peso
    // de "llegar" cambia poco a poco (no de golpe) para que invertir el sentido no dé saltos
    const llegada = interpolate(d * dir.get(), [-0.35, 0.35], [0, 1], Extrapolation.CLAMP);
    const alzada = llegada * Math.sin(Math.PI * Math.min(a, 1));
    return {
      opacity: interpolate(a, [0, 1.05, 2], [1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: lado * ancho * DESPLAZAMIENTO },
        { translateY: Math.min(a, 1) * BAJADA - alzada * ALZADA },
        { rotate: `${giro * GIRO}deg` },
        { scale: 1 + alzada * 0.04 },
      ],
    };
  });

  return (
    <Animated.View
      // La carta se rasteriza una vez: al moverla, girarla o alzarla solo se transforma esa
      // textura, así la foto y la tarjeta no se deforman ni parpadean mientras se anima
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[
        styles.carta,
        { width: cardWidth, left: (ancho - cardWidth) / 2, zIndex: capa },
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
              <PieAcciones
                item={item}
                lugar={lugar}
                pos={pos}
                activa={activa}
                isDark={isDark}
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
      {/* Las que no están al centro: tocarlas las trae al frente */}
      {item && !activa ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver ${item.name}`}
          onPress={() => onCentrar(lugar)}
          style={styles.toqueCarta}
        />
      ) : null}
    </Animated.View>
  );
});

/**
 * Parte de abajo de la tarjeta en el perfil propio: solo la central muestra los botones de
 * republicar, editar y eliminar; en las de los lados se ven el título y el precio. Se funden
 * entre sí mientras la tarjeta se mueve.
 */
function PieAcciones({
  item,
  lugar,
  pos,
  activa,
  isDark,
  onEditar,
  onEliminar,
}: {
  item: Product;
  lugar: number;
  pos: SharedValue<number>;
  activa: boolean;
  isDark: boolean;
  onEditar: (item: Product) => void;
  onEliminar: (item: Product) => void;
}) {
  const estiloAcciones = useAnimatedStyle(() => {
    const a = Math.abs(lugar - pos.get());
    return {
      opacity: interpolate(a, [0, 0.5], [1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(a, [0, 1], [1, 0.85], Extrapolation.CLAMP) },
      ],
    };
  });
  const estiloInfo = useAnimatedStyle(() => {
    const a = Math.abs(lugar - pos.get());
    return {
      opacity: interpolate(a, [0.3, 0.9], [0, 1], Extrapolation.CLAMP),
    };
  });
  const colorTexto = isDark ? "#F1F5F9" : "#101010";

  return (
    <View style={styles.pie}>
      <Animated.View
        pointerEvents="none"
        style={[styles.capaPie, styles.infoPie, estiloInfo]}
      >
        <Text numberOfLines={1} style={[styles.tituloPie, { color: colorTexto }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.precioPie, { color: colorTexto }]}>
          {formatProductPrice(item) ?? "Sin precio"}
        </Text>
      </Animated.View>
      <Animated.View
        pointerEvents={activa ? "auto" : "none"}
        style={[styles.capaPie, estiloAcciones]}
      >
        <AccionesPublicacion
          item={item}
          onEditar={onEditar}
          onEliminar={onEliminar}
        />
      </Animated.View>
    </View>
  );
}

/** Tarjeta gris sin publicación: mismo tamaño que las demás, con un icono y un texto */
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

/** Un punto del indicador: se oscurece cuando el carrusel se acerca a su lugar (con vuelta) */
function Punto({
  indice,
  pos,
  colorBase,
  colorActivo,
}: {
  indice: number;
  pos: SharedValue<number>;
  colorBase: string;
  colorActivo: string;
}) {
  const estiloActivo = useAnimatedStyle(() => {
    // Distancia circular entre la posición del carrusel y este punto
    const d = Math.abs(
      modulo(pos.get() - indice + MAX_PUNTOS / 2, MAX_PUNTOS) - MAX_PUNTOS / 2,
    );
    return { opacity: interpolate(d, [0, 1], [1, 0], Extrapolation.CLAMP) };
  });
  return (
    <View style={[styles.punto, { backgroundColor: colorBase }]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.punto, styles.puntoActivo, { backgroundColor: colorActivo }, estiloActivo]}
      />
    </View>
  );
}

/** Puntos (uno oscuro) y, debajo, la flecha izquierda y la derecha */
function Navegacion({
  puntos,
  pos,
  isDark,
  onPaso,
}: {
  puntos: number;
  pos: SharedValue<number>;
  isDark: boolean;
  onPaso: (sentido: number) => void;
}) {
  const colorFlecha = isDark ? "#F1F5F9" : "#101010";
  const colorBase = isDark ? "#ffffff30" : "#D4D4D8";

  return (
    <View style={styles.navegacion}>
      <View style={styles.puntos}>
        {Array.from({ length: puntos }, (_, k) => (
          <Punto
            key={k}
            indice={k}
            pos={pos}
            colorBase={colorBase}
            colorActivo={colorFlecha}
          />
        ))}
      </View>

      <View style={styles.flechas}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Publicación anterior"
          onPress={() => onPaso(-1)}
          scaleTo={0.85}
          hitSlop={12}
        >
          <IconoFlechaIzquierda size={28} color={colorFlecha} />
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Publicación siguiente"
          onPress={() => onPaso(1)}
          scaleTo={0.85}
          hitSlop={12}
        >
          <IconoFlechaDerecha size={28} color={colorFlecha} />
        </PressableScale>
      </View>
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
  pie: { height: ALTO_PIE },
  capaPie: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  infoPie: { justifyContent: "center", gap: 1, paddingHorizontal: 14 },
  tituloPie: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  precioPie: { fontFamily: "Inter_500Medium", fontSize: 13.5 },
  toqueCarta: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  // Puntos y flechas más abajo, y las flechas un poco más separadas de los puntos
  navegacion: { alignItems: "center", gap: 14, paddingTop: 28, paddingBottom: 6 },
  puntos: { flexDirection: "row", alignItems: "center", gap: 7 },
  // Círculos perfectos: tamaño fijo que no se encoge ni se estira
  punto: {
    width: LADO_PUNTO,
    height: LADO_PUNTO,
    borderRadius: LADO_PUNTO / 2,
    flexShrink: 0,
    flexGrow: 0,
  },
  puntoActivo: { position: "absolute", top: 0, left: 0 },
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
  flechas: { flexDirection: "row", alignItems: "center", gap: 56 },
});
