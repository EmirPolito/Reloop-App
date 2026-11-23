import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type DerivedValue,
  type SharedValue,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { Text } from "@/features/shared/Text";
import { RECORRIDO } from "./2-barra-superior";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { LADO_AVATAR, coloresTarjeta, fondoPerfil } from "./estilos";
import { conArroba } from "./nombreUsuario";
import { PildoraPerfil } from "./PildoraPerfil";
import { DESCRIPCION_POR_DEFECTO, type DatosPerfil } from "./temasPerfil";

/** Cuánto sobresale el avatar por encima del borde inferior de la portada */
export const SOLAPE_AVATAR = 44;
/** Borde del color de la pantalla alrededor del avatar */
export const BORDE_AVATAR = 3;
/** Tamaño final del avatar al colapsar (se esconde bajo el header) */
const ESCALA_AVATAR_MIN = 0.6;
/** Espacio entre el avatar y el nombre */
const ESPACIO_NOMBRE = 0;

/** Formatea números grandes estilo red social: 12.6k, 1.2M */
export function formatearNumero(valor: number): string {
  if (valor >= 1_000_000) {
    const v = (valor / 1_000_000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}M`;
  }
  if (valor >= 1_000) {
    const v = (valor / 1_000).toFixed(1);
    return `${v.endsWith(".0") ? v.slice(0, -2) : v}k`;
  }
  return String(valor);
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
    <View style={estilos.estadistica}>
      <Text
        numberOfLines={1}
        style={[estilos.estadisticaValor, { color: colorTexto }]}
      >
        {valor}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[estilos.estadisticaEtiqueta, { color: suave }]}
      >
        {etiqueta}
      </Text>
    </View>
  );
}

/**
 * Debajo de la portada: el avatar (sobresale de ella y se encoge al colapsar) con las píldoras
 * a su derecha; luego nombre, @usuario, descripción, las tres estadísticas y las acciones
 * (Mensaje y Seguir en el perfil ajeno). Avisa dónde termina el nombre para que el título
 * pequeño del header entre justo cuando el grande pasa por debajo.
 */
export function InformacionPerfil({
  profile,
  isDark,
  placeholder,
  premium,
  stats,
  acciones,
  onSeguidores,
  altoPortada,
  colapso,
  finNombre,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  placeholder: "icono" | "iniciales";
  premium: boolean;
  stats: { publicaciones: number; seguidores: number; reputacion: string };
  acciones?: ReactNode;
  onSeguidores?: () => void;
  altoPortada: number;
  /** Scroll recortado al recorrido de la portada */
  colapso: DerivedValue<number>;
  finNombre: SharedValue<number>;
}) {
  const fondo = fondoPerfil(isDark);
  const { suave } = coloresTarjeta(isDark);
  // Lo de debajo de los números: en oscuro, claro pero no tanto
  const suaveStats = isDark ? "#C4C7CC" : suave;
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const colorLinea = isDark ? "#ffffff24" : "#E4E4E7";
  const ladoMarco = LADO_AVATAR + BORDE_AVATAR * 2;

  // El avatar se encoge hacia abajo a la izquierda mientras la portada colapsa
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

  return (
    <>
      <View
        style={[
          estilos.filaAvatar,
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
          <View style={estilos.avatar}>
            <PerfilAvatar
              photo={profile.photo}
              orb={profile.orb}
              color={profile.color}
              name={profile.name}
              placeholder={placeholder}
            />
          </View>
        </Animated.View>

        {profile.pills.length > 0 ? (
          <View style={estilos.pildorasAvatar}>
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

      <View style={estilos.info}>
        <View
          style={estilos.filaNombre}
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
            style={[estilos.nombre, { color: colorTexto }]}
          >
            {profile.name}
          </Text>
          {premium ? (
            <PremiumBadge size={24} style={estilos.insigniaNombre} />
          ) : null}
        </View>
        {profile.username ? (
          <Text
            // En oscuro, el mismo claro que en Editar perfil
            style={[estilos.usuario, { color: isDark ? "#C4C7CC" : suave }]}
          >
            {conArroba(profile.username)}
          </Text>
        ) : null}

        <Text style={[estilos.descripcion, { color: colorTexto }]}>
          {profile.description.trim() || DESCRIPCION_POR_DEFECTO}
        </Text>

        {/* Las tres estadísticas, sin iconos, separadas por dos líneas finas */}
        <View style={estilos.stats}>
          <Estadistica
            valor={formatearNumero(stats.publicaciones)}
            etiqueta={stats.publicaciones === 1 ? "Subido" : "Subidos"}
            colorTexto={colorTexto}
            suave={suaveStats}
          />
          <View style={[estilos.linea, { backgroundColor: colorLinea }]} />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Ver seguidores y seguidos"
            disabled={!onSeguidores}
            onPress={onSeguidores}
            scaleTo={0.96}
            style={estilos.estadisticaBoton}
          >
            <Estadistica
              valor={formatearNumero(stats.seguidores)}
              etiqueta={stats.seguidores === 1 ? "Seguidor" : "Seguidores"}
              colorTexto={colorTexto}
              suave={suaveStats}
            />
          </PressableScale>
          <View style={[estilos.linea, { backgroundColor: colorLinea }]} />
          <Estadistica
            valor={stats.reputacion}
            etiqueta="Valoración"
            colorTexto={colorTexto}
            suave={suaveStats}
          />
        </View>

        {acciones ? <View style={estilos.acciones}>{acciones}</View> : null}
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
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
  info: { paddingHorizontal: 16, paddingTop: ESPACIO_NOMBRE, gap: 4 },
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
  // Tres estadísticas a todo el ancho, más abajo que las píldoras para que no se vean juntas
  stats: { flexDirection: "row", alignItems: "center", marginTop: 30 },
  estadistica: { flex: 1, alignItems: "center", gap: 2 },
  estadisticaBoton: { flex: 1 },
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
});
