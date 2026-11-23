import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type DerivedValue,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Text } from "@/features/shared/Text";
import {
  ALTO_PORTADA,
  CapaPortada,
  estilos as estilosPortada,
} from "./1-portada";
import type { DatosPerfil } from "./temasPerfil";

/** Alto del header ya colapsado (sin contar la barra de estado) */
export const ALTO_HEADER = 57;
/** Lo que recorre la portada hasta quedar como header */
export const RECORRIDO = ALTO_PORTADA - ALTO_HEADER;
/** Avatar pequeño que entra al header junto al nombre */
const LADO_AVATAR_HEADER = 38;

/** Botón redondo translúcido del header (editar perfil, mensaje, menú) */
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
      style={estilos.botonHeader}
    >
      {children}
    </PressableScale>
  );
}

/**
 * Lo fijo de arriba del perfil, encima del scroll:
 * - El header colapsado: el trozo de la portada que queda al terminar el recorrido, que
 *   aparece por opacidad (la capa nunca cambia de orden respecto al scroll, que en iOS
 *   reordenaría sus vistas a mitad del gesto), con el desenfoque que entra junto al título.
 * - La barra con el título pequeño (avatar, nombre y publicaciones) y los botones.
 */
export function BarraSuperior({
  profile,
  premium,
  publicaciones,
  derecha,
  cover,
  cielo,
  insetTop,
  altoPortada,
  headerFijoVisible,
  progresoDesenfoque,
  progresoTitulo,
  onErrorPortada,
}: {
  profile: DatosPerfil;
  premium: boolean;
  /** Cuántas publicaciones tiene (para el subtítulo) */
  publicaciones: number;
  derecha?: ReactNode;
  cover: string | null;
  cielo: [string, string, string];
  insetTop: number;
  altoPortada: number;
  headerFijoVisible: DerivedValue<number>;
  progresoDesenfoque: DerivedValue<number>;
  progresoTitulo: DerivedValue<number>;
  onErrorPortada: () => void;
}) {
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

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          estilos.headerFijo,
          { height: insetTop + ALTO_HEADER },
          estiloHeaderFijo,
        ]}
      >
        <View
          style={[
            estilosPortada.portada,
            { height: altoPortada, transform: [{ translateY: -RECORRIDO }] },
          ]}
        >
          <CapaPortada
            cover={cover}
            cielo={cielo}
            insetTop={insetTop}
            onError={onErrorPortada}
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
          <View style={[StyleSheet.absoluteFill, estilos.veloColapsado]} />
        </Animated.View>
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={[estilos.barra, { top: insetTop, height: ALTO_HEADER }]}
      >
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[estilos.titulo, estiloTitulo]}
        >
          {/* El avatar entra al header junto con el nombre cuando el grande se esconde */}
          <View style={estilos.avatarHeader}>
            <UserAvatar
              photo={profile.photo}
              orb={profile.orb}
              name={profile.name}
              size={LADO_AVATAR_HEADER}
            />
          </View>
          <View style={estilos.textoTitulo}>
            <View style={estilos.filaTitulo}>
              <Text numberOfLines={1} style={estilos.tituloNombre}>
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
            <Text numberOfLines={1} style={estilos.tituloSub}>
              {publicaciones} {publicaciones === 1 ? "subido" : "subidos"}
            </Text>
          </View>
        </Animated.View>
        <View style={estilos.derecha}>{derecha}</View>
      </View>
    </>
  );
}

const estilos = StyleSheet.create({
  headerFijo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  veloColapsado: { backgroundColor: "rgba(0,0,0,0.28)" },
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingBottom: 4,
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
  avatarHeader: { borderRadius: 100, borderWidth: 0, overflow: "hidden" },
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
});
