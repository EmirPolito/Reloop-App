import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { LADO_AVATAR, coloresTarjeta, fondoPerfil } from "../perfilEstilos";
import {
  DESCRIPCION_POR_DEFECTO,
  gradienteCieloPerfil,
  type DatosPerfil,
} from "../Perfiltemas";
import { PildoraPerfil } from "../Pildoraperfil";
import { conArroba } from "../username";
import { PerfilAvatar } from "./PerfilAvatar";
import { PublicacionesPerfil, SIN_ANUNCIOS } from "./PublicacionesPerfil";

/** Alto de la portada abierta y del header ya colapsado (sin contar la barra de estado) */
const ALTO_PORTADA = 120;
const ALTO_HEADER = 52;
/** Lo que recorre la portada hasta quedar como header */
const RECORRIDO = ALTO_PORTADA - ALTO_HEADER;
/** El avatar sobresale de la portada la mitad de su alto */
const SOLAPE_AVATAR = LADO_AVATAR / 2;
/** Tamaño final del avatar al colapsar (se esconde bajo el header) */
const ESCALA_AVATAR_MIN = 0.6;
/** Borde del color de la pantalla alrededor del avatar */
const BORDE_AVATAR = 4;
/** Recorrido con el que el título pequeño entra al header */
const ENTRADA_TITULO = 28;
const ANCHO_PORTADA = 900;
/** Margen a los lados de la tarjeta y de las publicaciones */
const MARGEN_LATERAL = 15;

/** Botón redondo translúcido del header (volver, editar perfil) */
export function BotonHeaderPerfil({
  etiqueta,
  onPress,
  children,
}: {
  etiqueta: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      scaleTo={0.9}
      hitSlop={6}
      style={styles.botonHeader}
    >
      {children}
    </PressableScale>
  );
}

/**
 * Estructura animada del perfil (propio y público), al estilo de los perfiles de X: la
 * portada se queda arriba y, al hacer scroll, se encoge hasta ser el header y se
 * desenfoca; el nombre entra deslizándose al header cuando el grande pasa por debajo; el
 * avatar se encoge y se esconde tras la portada, y las pestañas quedan pegadas bajo el
 * header. Todo sigue al dedo en el hilo de UI.
 */
export function PerfilDesplazable({
  profile,
  isDark,
  placeholder,
  premium,
  izquierda,
  derecha,
  acciones,
  stats,
  tarjeta,
  publicaciones,
  pie,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Sin foto ni orbe: icono (perfil propio) o iniciales (perfil ajeno) */
  placeholder: "icono" | "iniciales";
  /** Membresía Premium vigente: muestra la insignia junto al nombre */
  premium: boolean;
  /** Botones del header (fijos arriba) */
  izquierda?: ReactNode;
  derecha?: ReactNode;
  /** A la derecha del avatar: Seguir y Mensaje */
  acciones?: ReactNode;
  stats: { publicaciones: number; seguidores: number; reputacion: string };
  /** Entre la información y las pestañas (tarjeta Premium) */
  tarjeta?: ReactNode;
  publicaciones: {
    items: Product[];
    status: FeedStatus;
    isOwn: boolean;
    onOpen: (productId: string) => void;
  };
  /** Después de las publicaciones (General, Legal y Cerrar sesión en el perfil propio) */
  pie?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const fondo = fondoPerfil(isDark);
  const { suave } = coloresTarjeta(isDark);
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const altoPortada = insets.top + ALTO_PORTADA;
  const altoHeader = insets.top + ALTO_HEADER;

  const scrollY = useSharedValue(0);
  // Dónde termina el nombre grande: ahí empieza a entrar el título pequeño
  const finNombre = useSharedValue(Number.MAX_SAFE_INTEGER);
  const [fallaPortada, setFallaPortada] = useState<string | null>(null);
  // Dónde empiezan las pestañas: con pocas publicaciones el contenido igual deja subir hasta
  // pegarlas bajo el header (si no, la portada nunca terminaría de colapsar)
  const [inicioPestanas, setInicioPestanas] = useState(0);
  const { height: altoVentana } = useWindowDimensions();

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  // Portada: sube hasta dejar solo el header; al estirar hacia abajo (iOS) se agranda.
  // Mientras colapsa queda detrás del contenido (el avatar sobresale por encima); ya
  // colapsada pasa al frente y el avatar se esconde detrás.
  const estiloPortada = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      zIndex: y >= RECORRIDO ? 2 : 0,
      transform: [
        { translateY: -Math.min(Math.max(y, 0), RECORRIDO) },
        { scale: y < 0 ? 1 + -y / altoPortada : 1 },
      ],
    };
  });

  // Desenfoque y velo: aparecen cuando el título pequeño entra
  const estiloDesenfoque = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.get(),
      [
        finNombre.get() - altoHeader - ENTRADA_TITULO,
        finNombre.get() - altoHeader,
      ],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const estiloTitulo = useAnimatedStyle(() => {
    const avance = interpolate(
      scrollY.get(),
      [
        finNombre.get() - altoHeader,
        finNombre.get() - altoHeader + ENTRADA_TITULO,
      ],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: avance,
      transform: [{ translateY: (1 - avance) * 22 }],
    };
  });

  // Avatar: se encoge hacia abajo a la izquierda mientras la portada colapsa
  const estiloAvatar = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.get(),
          [0, RECORRIDO],
          [1, ESCALA_AVATAR_MIN],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const conPortada = profile.cover !== null && profile.cover !== fallaPortada;
  const cielo = gradienteCieloPerfil(profile.color, isDark);
  const ladoMarco = LADO_AVATAR + BORDE_AVATAR * 2;

  return (
    <View style={{ flex: 1, backgroundColor: fondo }}>
      <Animated.ScrollView
        style={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: altoPortada,
          paddingBottom: 110,
          minHeight: inicioPestanas - altoHeader + altoVentana,
        }}
      >
        {/* Avatar (sobresale de la portada) y acciones a la derecha */}
        <View
          style={[
            styles.filaAvatar,
            { marginTop: -SOLAPE_AVATAR - BORDE_AVATAR },
          ]}
        >
          <Animated.View
            style={[
              {
                width: ladoMarco,
                height: ladoMarco,
                borderRadius: ladoMarco / 2,
                padding: BORDE_AVATAR,
                backgroundColor: fondo,
                transformOrigin: "left bottom",
              },
              estiloAvatar,
            ]}
          >
            <View style={styles.avatar}>
              <PerfilAvatar
                photo={profile.photo}
                orb={profile.orb}
                color={profile.color}
                name={profile.name}
                placeholder={placeholder}
              />
            </View>
          </Animated.View>
          <View style={styles.acciones}>{acciones}</View>
        </View>

        {/* Nombre, @username, descripción, etiquetas y números */}
        <View style={styles.info}>
          <View
            style={styles.filaNombre}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              // `info` empieza tras la fila del avatar: se suma su posición
              finNombre.set(
                altoPortada + LADO_AVATAR / 2 + BORDE_AVATAR + 12 + y + height,
              );
            }}
          >
            <Text
              numberOfLines={2}
              style={[styles.nombre, { color: colorTexto }]}
            >
              {profile.name}
            </Text>
            {premium ? (
              <PremiumBadge size={24} style={styles.insigniaNombre} />
            ) : null}
          </View>
          {profile.username ? (
            <Text style={[styles.usuario, { color: suave }]}>
              {conArroba(profile.username)}
            </Text>
          ) : null}

          <Text style={[styles.descripcion, { color: colorTexto }]}>
            {profile.description.trim() || DESCRIPCION_POR_DEFECTO}
          </Text>

          {profile.pills.length > 0 ? (
            <View style={styles.pildoras}>
              {profile.pills.map((pill) => (
                <PildoraPerfil
                  key={pill.id}
                  text={pill.text}
                  color={pill.color}
                  icon={pill.icon}
                  isDark={isDark}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.numeros}>
            <Numero
              valor={String(stats.publicaciones)}
              etiqueta={
                stats.publicaciones === 1 ? "publicación" : "publicaciones"
              }
              fuerte={colorTexto}
              suave={suave}
            />
            <Numero
              valor={String(stats.seguidores)}
              etiqueta={stats.seguidores === 1 ? "seguidor" : "seguidores"}
              fuerte={colorTexto}
              suave={suave}
            />
            <Numero
              valor={`★ ${stats.reputacion}`}
              etiqueta="valoración"
              fuerte={colorTexto}
              suave={suave}
            />
          </View>
        </View>

        {tarjeta ? <View style={styles.tarjeta}>{tarjeta}</View> : null}

        <View onLayout={(e) => setInicioPestanas(e.nativeEvent.layout.y)} />

        <PublicacionesPerfil
          publicaciones={publicaciones.items}
          anuncios={SIN_ANUNCIOS}
          status={publicaciones.status}
          isOwn={publicaciones.isOwn}
          isDark={isDark}
          onOpen={publicaciones.onOpen}
          fijar={{ scrollY, altoHeader, margen: MARGEN_LATERAL }}
          style={styles.pestanas}
        />

        {pie}
      </Animated.ScrollView>

      {/* Portada → header. Va encima del contenido: el avatar pasa por debajo al colapsar */}
      <Animated.View
        pointerEvents="none"
        style={[styles.portada, { height: altoPortada }, estiloPortada]}
      >
        {conPortada ? (
          <Image
            source={{
              uri:
                optimizedImageUrl(profile.cover, ANCHO_PORTADA) ??
                profile.cover ??
                undefined,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={200}
            onError={() => setFallaPortada(profile.cover)}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient colors={cielo} style={StyleSheet.absoluteFill} />
        )}
        {/* Velo arriba para que la hora y los botones se lean sobre cualquier imagen */}
        <LinearGradient
          colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0)"]}
          style={[styles.veloSuperior, { height: insets.top + 50 }]}
        />
        <Animated.View style={[StyleSheet.absoluteFill, estiloDesenfoque]}>
          {/* En Android el desenfoque no está activo en la app: lo suple el velo */}
          {Platform.OS !== "android" ? (
            <BlurView
              intensity={28}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, styles.veloColapsado]} />
        </Animated.View>
      </Animated.View>

      {/* Botones y título pequeño: fijos sobre el header */}
      <View
        pointerEvents="box-none"
        style={[styles.barra, { top: insets.top, height: ALTO_HEADER }]}
      >
        {izquierda}
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.titulo,
            izquierda ? null : styles.tituloSinBoton,
            estiloTitulo,
          ]}
        >
          <View style={styles.filaTitulo}>
            <Text numberOfLines={1} style={styles.tituloNombre}>
              {profile.name}
            </Text>
            {premium ? <PremiumBadge size={17} variant="static" /> : null}
          </View>
          <Text numberOfLines={1} style={styles.tituloSub}>
            {stats.publicaciones}{" "}
            {stats.publicaciones === 1 ? "publicación" : "publicaciones"}
          </Text>
        </Animated.View>
        <View style={styles.derecha}>{derecha}</View>
      </View>
    </View>
  );
}

/** "12 publicaciones": número en negrita y etiqueta en gris */
function Numero({
  valor,
  etiqueta,
  fuerte,
  suave,
}: {
  valor: string;
  etiqueta: string;
  fuerte: string;
  suave: string;
}) {
  return (
    <Text style={[styles.numeroEtiqueta, { color: suave }]}>
      <Text style={[styles.numeroValor, { color: fuerte }]}>{valor}</Text>{" "}
      {etiqueta}
    </Text>
  );
}

const styles = StyleSheet.create({
  scroll: { zIndex: 1 },
  portada: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    transformOrigin: "top",
  },
  veloSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
  veloColapsado: { backgroundColor: "rgba(0,0,0,0.28)" },
  barra: {
    position: "absolute",
    zIndex: 3,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  botonHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  titulo: { flex: 1, minWidth: 0 },
  tituloSinBoton: { paddingLeft: 4 },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 5 },
  tituloNombre: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  tituloSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.82)",
  },
  derecha: { flexDirection: "row", alignItems: "center", gap: 10 },
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  avatar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    overflow: "hidden",
  },
  acciones: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  info: { paddingHorizontal: 16, paddingTop: 12, gap: 6 },
  filaNombre: { flexDirection: "row", alignItems: "center", gap: 6 },
  nombre: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    letterSpacing: -0.7,
    lineHeight: 30,
  },
  insigniaNombre: { marginTop: 1 },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 14.5, marginTop: -4 },
  descripcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 14.5,
    lineHeight: 20,
    marginTop: 6,
  },
  pildoras: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  numeros: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 4,
    marginTop: 6,
  },
  numeroValor: { fontFamily: "Inter_600SemiBold" },
  numeroEtiqueta: { fontFamily: "Inter_400Regular", fontSize: 14 },
  tarjeta: { paddingHorizontal: MARGEN_LATERAL, marginTop: 18 },
  pestanas: { marginTop: 14, paddingHorizontal: MARGEN_LATERAL },
});
