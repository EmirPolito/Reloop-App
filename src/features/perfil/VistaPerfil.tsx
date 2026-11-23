import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated as AnimatedNativo,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BloqueoScrollContext,
  useBloqueoScroll,
} from "@/components/bloqueoScroll";
import { PausaBrilloContext } from "@/components/ui/PremiumBadge";
import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";
import { ALTO_PORTADA, PortadaEstirable } from "./1-portada";
import { ALTO_HEADER, BarraSuperior, RECORRIDO } from "./2-barra-superior";
import { InformacionPerfil } from "./3-informacion";
import { PublicacionesPerfil, SIN_ANUNCIOS } from "./4-publicaciones";
import { fondoPerfil } from "./estilos";
import { gradienteCieloPerfil, type DatosPerfil } from "./temasPerfil";

/** Recorrido con el que el título pequeño entra al header */
const ENTRADA_TITULO = 28;
/** Píxeles de anticipación para que el desenfoque y el título salgan un poco antes */
const ADELANTO_HEADER = 22;
/** Margen a los lados de las publicaciones */
const MARGEN_LATERAL = 15;

/**
 * El perfil (propio y público), al estilo de los perfiles de X (ver `README.md`): la portada
 * se queda arriba y, al hacer scroll, se encoge hasta ser el header y se desenfoca; el nombre
 * entra deslizándose al header cuando el grande pasa por debajo; el avatar se encoge y se
 * esconde tras la portada. Todo sigue al dedo en el hilo de UI.
 */
export function VistaPerfil({
  profile,
  isDark,
  placeholder,
  premium,
  derecha,
  acciones,
  stats,
  onSeguidores,
  publicaciones,
  pie,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Sin foto ni orbe: icono (perfil propio) o iniciales (perfil ajeno) */
  placeholder: "icono" | "iniciales";
  /** Membresía Premium vigente: muestra la insignia junto al nombre */
  premium: boolean;
  /** Botones del header (fijos arriba a la derecha) */
  derecha?: ReactNode;
  /** Debajo de la descripción: Mensaje y Seguir (perfil ajeno) */
  acciones?: ReactNode;
  stats: { publicaciones: number; seguidores: number; reputacion: string };
  /** Al tocar Seguidores: abre la lista de seguidores y seguidos */
  onSeguidores?: () => void;
  publicaciones: {
    items: Product[];
    status: FeedStatus;
    isOwn: boolean;
    onOpen: (productId: string) => void;
  };
  /** Después de las publicaciones (Premium, ajustes y cerrar sesión en el perfil propio) */
  pie?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const altoPortada = insets.top + ALTO_PORTADA;
  const altoHeader = insets.top + ALTO_HEADER;

  const scrollY = useSharedValue(0);
  // 1 mientras el dedo o la inercia mueven el scroll
  const arrastre = useSharedValue(0);
  // Dónde termina el nombre grande: ahí empieza a entrar el título pequeño
  const finNombre = useSharedValue(Number.MAX_SAFE_INTEGER);
  const [fallaPortada, setFallaPortada] = useState<string | null>(null);
  const esIOS = Platform.OS === "ios";

  // Mientras se arrastran las fotos de la tarjeta grande, el perfil no se mueve
  const { bloqueo, propsBloqueo } = useBloqueoScroll();
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      // Un contenido más ancho que la vista es el carrusel de la tarjeta grande, no el perfil
      if (e.contentSize.width > e.layoutMeasurement.width + 1) return;
      scrollY.set(e.contentOffset.y);
    },
    onBeginDrag: () => {
      arrastre.set(1);
    },
    onEndDrag: (e) => {
      // En iOS, soltar sin velocidad no genera inercia (ni aviso de que terminó)
      if (esIOS && Math.abs(e.velocity?.y ?? 0) < 0.05) arrastre.set(0);
    },
    onMomentumBegin: () => {
      arrastre.set(1);
    },
    onMomentumEnd: () => {
      arrastre.set(0);
    },
  });
  // Las insignias detienen su brillo mientras algo se mueve: el scroll, el carrusel de la
  // tarjeta grande o el rebote al estirar arriba (si arrancaba ahí, la portada temblaba)
  const desplazando = useDerivedValue<number>(() =>
    arrastre.get() === 1 || bloqueo.get() === 1 || scrollY.get() < 0 ? 1 : 0,
  );

  // Cada animación depende de un valor ya recortado a su rango: fuera de él no cambia y no
  // hay nada que actualizar (con el scroll en crudo se mandarían estilos en cada cuadro)
  const colapso = useDerivedValue(() =>
    Math.min(Math.max(scrollY.get(), 0), RECORRIDO),
  );
  // El header colapsado entra por opacidad al terminar el recorrido
  const headerFijoVisible = useDerivedValue<number>(() =>
    scrollY.get() >= RECORRIDO ? 1 : 0,
  );
  const progresoTitulo = useDerivedValue(() =>
    interpolate(
      scrollY.get(),
      [
        finNombre.get() - altoHeader - ADELANTO_HEADER,
        finNombre.get() - altoHeader - ADELANTO_HEADER + ENTRADA_TITULO,
      ],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );
  const progresoDesenfoque = useDerivedValue(() =>
    interpolate(
      scrollY.get(),
      [
        finNombre.get() - altoHeader - ENTRADA_TITULO - ADELANTO_HEADER,
        finNombre.get() - altoHeader - ADELANTO_HEADER,
      ],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  );

  // El estiramiento de la portada va con el driver nativo de Animated, conectado al evento
  // de scroll del lado nativo: se aplica en el mismo cuadro que el scroll (con Reanimated,
  // sin su opción nativa que Expo Go no permite, llegaba un cuadro tarde y temblaba)
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [scrollNativo] = useState(() => new AnimatedNativo.Value(0));
  useEffect(() => {
    const vista = scrollRef.current;
    if (!vista) return;
    const enlace = AnimatedNativo.attachNativeEvent(
      vista,
      "onScroll",
      [{ nativeEvent: { contentOffset: { y: scrollNativo } } }],
      undefined,
    );
    return () => enlace.detach();
  }, [scrollNativo]);
  const escalaPortada = useMemo(
    () =>
      scrollNativo.interpolate({
        inputRange: [-altoPortada, 0],
        outputRange: [2, 1],
        extrapolateLeft: "extend",
        extrapolateRight: "clamp",
      }),
    [scrollNativo, altoPortada],
  );

  const cover =
    profile.cover !== null && profile.cover !== fallaPortada
      ? profile.cover
      : null;
  const cielo = gradienteCieloPerfil(profile.color, isDark);
  const alFallarPortada = () => setFallaPortada(profile.cover);

  return (
    <BloqueoScrollContext.Provider value={bloqueo}>
      <PausaBrilloContext.Provider value={desplazando}>
        <View style={{ flex: 1, backgroundColor: fondoPerfil(isDark) }}>
          <Animated.ScrollView
            ref={scrollRef}
            animatedProps={propsBloqueo}
            style={estilos.scroll}
            onScroll={onScroll}
            // Sin `scrollEventThrottle`: Animated.ScrollView usa 1 (un evento por cuadro); con
            // 16 las animaciones del header iban a ~60 Hz en pantallas de 120 Hz
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: altoPortada,
              paddingBottom: 115,
            }}
          >
            {/* Dentro del scroll y detrás del avatar (que se dibuja después) */}
            <PortadaEstirable
              cover={cover}
              cielo={cielo}
              insetTop={insets.top}
              alto={altoPortada}
              escala={escalaPortada}
              onError={alFallarPortada}
            />

            <InformacionPerfil
              profile={profile}
              isDark={isDark}
              placeholder={placeholder}
              premium={premium}
              stats={stats}
              acciones={acciones}
              onSeguidores={onSeguidores}
              altoPortada={altoPortada}
              colapso={colapso}
              finNombre={finNombre}
            />

            <PublicacionesPerfil
              publicaciones={publicaciones.items}
              anuncios={SIN_ANUNCIOS}
              perfil={profile}
              status={publicaciones.status}
              isOwn={publicaciones.isOwn}
              isDark={isDark}
              onOpen={publicaciones.onOpen}
              style={estilos.pestanas}
            />

            {pie}
          </Animated.ScrollView>

          <BarraSuperior
            profile={profile}
            premium={premium}
            publicaciones={stats.publicaciones}
            derecha={derecha}
            cover={cover}
            cielo={cielo}
            insetTop={insets.top}
            altoPortada={altoPortada}
            headerFijoVisible={headerFijoVisible}
            progresoDesenfoque={progresoDesenfoque}
            progresoTitulo={progresoTitulo}
            onErrorPortada={alFallarPortada}
          />
        </View>
      </PausaBrilloContext.Provider>
    </BloqueoScrollContext.Provider>
  );
}

const estilos = StyleSheet.create({
  scroll: { flex: 1 },
  pestanas: { marginTop: 40, paddingHorizontal: MARGEN_LATERAL },
});
