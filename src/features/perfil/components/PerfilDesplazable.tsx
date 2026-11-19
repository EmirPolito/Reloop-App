import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { PausaBrilloContext, PremiumBadge } from "@/components/ui/PremiumBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
export const ALTO_PORTADA = 150;
const ALTO_HEADER = 57;
/** Lo que recorre la portada hasta quedar como header */
const RECORRIDO = ALTO_PORTADA - ALTO_HEADER;
/** Cuánto sobresale el avatar por encima del borde inferior de la portada */
export const SOLAPE_AVATAR = 44;
/** Tamaño final del avatar al colapsar (se esconde bajo el header) */
const ESCALA_AVATAR_MIN = 0.6;
/** Borde del color de la pantalla alrededor del avatar */
export const BORDE_AVATAR = 3;
/** Recorrido con el que el título pequeño entra al header */
const ENTRADA_TITULO = 28;
/** Píxeles de anticipación para que el desenfoque y el título salgan un poco antes */
const ADELANTO_HEADER = 22;
const ANCHO_PORTADA = 900;
/** Avatar pequeño que entra al header junto al nombre */
const LADO_AVATAR_HEADER = 38;
/** Margen a los lados de las publicaciones */
const MARGEN_LATERAL = 15;
/** Espacio entre el avatar y el nombre */
const ESPACIO_NOMBRE = 0;

/** Botón redondo translúcido del header (editar perfil) */
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
  derecha,
  acciones,
  stats,
  publicaciones,
  pie,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Sin foto ni orbe: icono (perfil propio) o iniciales (perfil ajeno) */
  placeholder: "icono" | "iniciales";
  /** Membresía Premium vigente: muestra la insignia junto al nombre */
  premium: boolean;
  /** Botón del header (fijo arriba a la derecha) */
  derecha?: ReactNode;
  /** Debajo de la descripción: Mensaje y Seguir (perfil ajeno) */
  acciones?: ReactNode;
  stats: { publicaciones: number; seguidores: number; reputacion: string };
  publicaciones: {
    items: Product[];
    status: FeedStatus;
    isOwn: boolean;
    onOpen: (productId: string) => void;
  };
  /** Después de las publicaciones (banner Premium, General, Legal y Cerrar sesión en el perfil propio) */
  pie?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const fondo = fondoPerfil(isDark);
  const { suave } = coloresTarjeta(isDark);
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  // Card de las estadísticas (blanca en claro) y mini cards de dentro (neutral-100)
  const colorLinea = isDark ? "#ffffff24" : "#E4E4E7";
  const altoPortada = insets.top + ALTO_PORTADA;
  const altoHeader = insets.top + ALTO_HEADER;

  const scrollY = useSharedValue(0);
  // 1 mientras el dedo o la inercia mueven el scroll: las insignias detienen su brillo
  const desplazando = useSharedValue(0);
  // Dónde termina el nombre grande: ahí empieza a entrar el título pequeño
  const finNombre = useSharedValue(Number.MAX_SAFE_INTEGER);
  const [fallaPortada, setFallaPortada] = useState<string | null>(null);
  const esIOS = Platform.OS === "ios";

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.set(e.contentOffset.y);
    },
    onBeginDrag: () => {
      desplazando.set(1);
    },
    onEndDrag: (e) => {
      // En iOS, soltar sin velocidad no genera inercia (ni aviso de que terminó)
      if (esIOS && Math.abs(e.velocity?.y ?? 0) < 0.05) desplazando.set(0);
    },
    onMomentumEnd: () => {
      desplazando.set(0);
    },
  });

  // Cada animación depende de un valor derivado que ya está recortado a su rango: fuera de
  // él el valor no cambia y no hay nada que actualizar. Si dependieran del scroll en crudo,
  // cada cuadro volvería a mandar sus estilos aunque no se movieran.
  const colapso = useDerivedValue(() =>
    Math.min(Math.max(scrollY.get(), 0), RECORRIDO),
  );
  const estirado = useDerivedValue(() => Math.max(-scrollY.get(), 0));
  // El header fijo (la portada ya colapsada) entra por opacidad al terminar el recorrido
  const headerFijoVisible = useDerivedValue(() =>
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
  // Portada: vive dentro del scroll (sube con el contenido, sin ningún cálculo por cuadro).
  // Solo al estirar hacia abajo (iOS) se agranda anclada arriba.
  const estiloEstiramiento = useAnimatedStyle(() => ({
    transform: [
      { translateY: -estirado.get() },
      { scale: 1 + estirado.get() / altoPortada },
    ],
  }));

  // Header fijo: la portada ya colapsada, encima del contenido
  const estiloHeaderFijo = useAnimatedStyle(() => ({
    opacity: headerFijoVisible.get(),
  }));

  // Desenfoque y velo: aparecen cuando el título pequeño entra
  const estiloDesenfoque = useAnimatedStyle(() => ({
    opacity: progresoDesenfoque.get(),
  }));

  const estiloTitulo = useAnimatedStyle(() => ({
    opacity: progresoTitulo.get(),
    transform: [{ translateY: (1 - progresoTitulo.get()) * 22 }],
  }));

  // Avatar: se encoge hacia abajo a la izquierda mientras la portada colapsa
  const estiloAvatar = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          colapso.get(),
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
    <PausaBrilloContext.Provider value={desplazando}>
      <View style={{ flex: 1, backgroundColor: fondo }}>
        <Animated.ScrollView
          style={styles.scroll}
          onScroll={onScroll}
          // Sin `scrollEventThrottle`: Animated.ScrollView usa 1 (un evento por cuadro). Con 16
          // las animaciones del header y las pestañas iban a ~60 Hz y se sentían pegajosas en
          // pantallas de 120 Hz
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: altoPortada,
            paddingBottom: 115,
          }}
        >
          {/* Portada: dentro del scroll y detrás del avatar (que se dibuja después) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.portada,
              { height: altoPortada },
              estiloEstiramiento,
            ]}
          >
            <CapaPortada
              cover={conPortada ? profile.cover : null}
              cielo={cielo}
              insetTop={insets.top}
              onError={() => setFallaPortada(profile.cover)}
            />
          </Animated.View>

          {/* Avatar (sobresale de la portada) y, a su derecha, números de estadísticas */}
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

            {/* Píldoras a la derecha del avatar, debajo de la portada */}
            {profile.pills.length > 0 ? (
              <View style={styles.pildorasAvatar}>
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
          </View>

          {/* Nombre, @username, descripción, estadísticas y acciones */}
          <View style={styles.info}>
            <View
              style={styles.filaNombre}
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                // `info` empieza tras la fila del avatar: se suma su posición
                finNombre.set(
                  altoPortada +
                    (ladoMarco - SOLAPE_AVATAR) +
                    ESPACIO_NOMBRE +
                    y +
                    height,
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

            {/* Las tres estadísticas, sin iconos, separadas por dos líneas finas */}
            <View style={styles.stats}>
              <Estadistica
                valor={formatearNumero(stats.publicaciones)}
                etiqueta={stats.publicaciones === 1 ? "Subido" : "Subidos"}
                colorTexto={colorTexto}
                suave={suave}
              />
              <View style={[styles.linea, { backgroundColor: colorLinea }]} />
              <Estadistica
                valor={formatearNumero(stats.seguidores)}
                etiqueta={stats.seguidores === 1 ? "Seguidor" : "Seguidores"}
                colorTexto={colorTexto}
                suave={suave}
              />
              <View style={[styles.linea, { backgroundColor: colorLinea }]} />
              <Estadistica
                valor={stats.reputacion}
                etiqueta="Valoración"
                colorTexto={colorTexto}
                suave={suave}
              />
            </View>

            {acciones ? <View style={styles.acciones}>{acciones}</View> : null}
          </View>

          <PublicacionesPerfil
            publicaciones={publicaciones.items}
            anuncios={SIN_ANUNCIOS}
            status={publicaciones.status}
            isOwn={publicaciones.isOwn}
            isDark={isDark}
            onOpen={publicaciones.onOpen}
            style={styles.pestanas}
          />

          {pie}
        </Animated.ScrollView>

        {/* Header fijo: el trozo de la portada que queda al colapsar, encima del contenido (el
            avatar y el resto pasan por debajo). Aparece por opacidad: la capa no cambia nunca
            de orden respecto al scroll, que en iOS reordenaría sus vistas a mitad del gesto. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.headerFijo, { height: altoHeader }, estiloHeaderFijo]}
        >
          <View
            style={[
              styles.portada,
              {
                height: altoPortada,
                transform: [{ translateY: -RECORRIDO }],
              },
            ]}
          >
            <CapaPortada
              cover={conPortada ? profile.cover : null}
              cielo={cielo}
              insetTop={insets.top}
              onError={() => setFallaPortada(profile.cover)}
            />
          </View>
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
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.titulo, estiloTitulo]}
          >
            {/* El avatar entra al header junto con el nombre cuando el grande se esconde */}
            <View style={styles.avatarHeader}>
              <UserAvatar
                photo={profile.photo}
                orb={profile.orb}
                name={profile.name}
                size={LADO_AVATAR_HEADER}
              />
            </View>
            <View style={styles.textoTitulo}>
              <View style={styles.filaTitulo}>
                <Text numberOfLines={1} style={styles.tituloNombre}>
                  {profile.name}
                </Text>
                {premium ? (
                  <PremiumBadge
                    size={18}
                    variant="static"
                    style={{ marginTop: 2, marginLeft: -2 }}
                  />
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.tituloSub}>
                {stats.publicaciones}{" "}
                {stats.publicaciones === 1 ? "subido" : "subidos"}
              </Text>
            </View>
          </Animated.View>
          <View style={styles.derecha}>{derecha}</View>
        </View>
      </View>
    </PausaBrilloContext.Provider>
  );
}

/** Una estadística: el número arriba y su nombre debajo */
export function Estadistica({
  valor,
  etiqueta,
  colorTexto,
  suave,
}: {
  valor: string;
  etiqueta: string;
  colorTexto: string;
  suave: string;
}) {
  return (
    <View style={styles.estadistica}>
      <Text
        numberOfLines={1}
        style={[styles.estadisticaValor, { color: colorTexto }]}
      >
        {valor}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.estadisticaEtiqueta, { color: suave }]}
      >
        {etiqueta}
      </Text>
    </View>
  );
}

/** Imagen (o degradado) de la portada y el velo de arriba; llena su contenedor */
export function CapaPortada({
  cover,
  cielo,
  insetTop,
  onError,
}: {
  cover: string | null;
  cielo: [string, string, string];
  insetTop: number;
  onError: () => void;
}) {
  return (
    <>
      {cover ? (
        <Image
          source={{ uri: optimizedImageUrl(cover, ANCHO_PORTADA) ?? cover }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={200}
          onError={onError}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient colors={cielo} style={StyleSheet.absoluteFill} />
      )}
      {/* Velo arriba para que la hora y los botones se lean sobre cualquier imagen */}
      <LinearGradient
        colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0)"]}
        style={[styles.veloSuperior, { height: insetTop + 50 }]}
      />
    </>
  );
}

/** Formatea números grandes estilo red social: 12.6k, 1.2M */
export function formatearNumero(valor: number): string {
  if (valor >= 1_000_000) {
    const v = (valor / 1_000_000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}M`;
  }
  if (valor >= 10_000) {
    const v = (valor / 1_000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}k`;
  }
  if (valor >= 1_000) {
    const v = (valor / 1_000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}k`;
  }
  return String(valor);
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  portada: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    transformOrigin: "top",
  },
  headerFijo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  veloSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
  veloColapsado: { backgroundColor: "rgba(0,0,0,0.28)" },
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 4, // Sube el contenido (más padding = más arriba; ajusta entre 2 y 12 según veas)
    gap: 12,
  },
  botonHeader: {
    width: 38,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  titulo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // Aro claro: el avatar se lee sobre cualquier portada
  avatarHeader: {
    borderRadius: 100,
    borderWidth: 0,
    overflow: "hidden",
  },
  textoTitulo: { flex: 1, minWidth: 0 },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 5 },
  tituloNombre: {
    flexShrink: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14.5,
    color: "#FFFFFF",
  },
  tituloSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#ffffffd1",
  },
  derecha: { flexDirection: "row", alignItems: "center", gap: 10 },
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  avatar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    overflow: "hidden",
  },
  // Tres estadísticas a todo el ancho, más abajo que las píldoras para que no se vean juntas
  stats: { flexDirection: "row", alignItems: "center", marginTop: 30 },
  estadistica: { flex: 1, alignItems: "center", gap: 2 },
  estadisticaValor: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    lineHeight: 22,
  },
  estadisticaEtiqueta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 17,
  },
  // Las dos líneas finas que separan las estadísticas
  linea: { width: StyleSheet.hairlineWidth * 2, height: 34 },
  // Mensaje y Seguir: uno junto al otro y del mismo ancho
  acciones: { flexDirection: "row", gap: 10, marginTop: 14 },
  info: { paddingHorizontal: 16, paddingTop: ESPACIO_NOMBRE, gap: 4 },
  // Bajado un poco respecto al avatar; el @usuario compensa para quedarse donde estaba
  filaNombre: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  nombre: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 19,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  insigniaNombre: { marginTop: 1.55, marginLeft: -4 },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 14.5, marginTop: -6.5 },
  descripcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    marginTop: 9,
  },
  // Píldoras a la derecha del avatar
  pildorasAvatar: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 9,
    marginLeft: 10,
    marginRight: -6,
    paddingBottom: 14,
    overflow: "hidden",
  },
  pestanas: { marginTop: 40, paddingHorizontal: MARGEN_LATERAL },
});
