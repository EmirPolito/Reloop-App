import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { IconoAnuncios, IconoPublicaciones } from "../Perfiliconos";

export type Pestana = "publicaciones" | "anuncios";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "publicaciones", label: "Publicaciones" },
  { id: "anuncios", label: "Anuncios" },
];

const MARGEN = 3;
const ALTO = 40;
const MARGEN_LATERAL = 6;
const DESLIZAR = { duration: 260, easing: Easing.bezier(0.3, 0, 0.2, 1) };

/** Icono y texto de una pestaña en un solo color */
function Contenido({
  id,
  label,
  color,
}: {
  id: Pestana;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.contenido}>
      {id === "publicaciones" ? (
        <IconoPublicaciones size={18} color={color} />
      ) : (
        <IconoAnuncios size={18} color={color} />
      )}
      <Text style={[styles.texto, { color }]}>{label}</Text>
    </View>
  );
}

/**
 * Selector de Publicaciones / Anuncios tipo píldoras: una barra redonda gris con dos mitades
 * iguales y una píldora oscura que se desliza hacia la pestaña elegida. El contenido de cada
 * mitad existe en dos colores (apagado y resaltado) y se funden mientras pasa la píldora, así
 * que el texto nunca queda blanco sobre gris. Solo se animan `transform` y `opacity`.
 */
export function FilaPestanas({
  activa,
  onCambiar,
  isDark,
}: {
  activa: Pestana;
  onCambiar: (pestana: Pestana) => void;
  isDark: boolean;
}) {
  const [ancho, setAncho] = useState(0);
  const progreso = useSharedValue(activa === "publicaciones" ? 0 : 1);
  useEffect(() => {
    progreso.set(withTiming(activa === "publicaciones" ? 0 : 1, DESLIZAR));
  }, [activa, progreso]);

  const mitad = (ancho - MARGEN * 2) / 2;
  const fondoBarra = isDark ? "#ffffff14" : "#EDEDF0";
  const fondoPildora = isDark ? "#F1F5F9" : "#0B0B0B";
  const colorApagado = isDark ? "#94A3B8" : "#6B7280";
  const colorResaltado = isDark ? "#0B0B0B" : "#FFFFFF";

  const estiloPildora = useAnimatedStyle(() => ({
    transform: [{ translateX: progreso.get() * mitad }],
  }));
  const resaltadoPrimera = useAnimatedStyle(() => ({
    opacity: 1 - progreso.get(),
  }));
  const resaltadoSegunda = useAnimatedStyle(() => ({
    opacity: progreso.get(),
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={[styles.barra, { backgroundColor: fondoBarra }]}
    >
      {ancho > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pildora,
            { width: mitad, backgroundColor: fondoPildora },
            estiloPildora,
          ]}
        />
      ) : null}

      {PESTANAS.map((p, i) => (
        <PressableSuave
          key={p.id}
          accessibilityRole="tab"
          accessibilityLabel={p.label}
          accessibilityState={{ selected: p.id === activa }}
          onPress={() => onCambiar(p.id)}
          scaleTo={0.97}
          style={styles.mitad}
        >
          <Contenido id={p.id} label={p.label} color={colorApagado} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.capaResaltada,
              i === 0 ? resaltadoPrimera : resaltadoSegunda,
            ]}
          >
            <Contenido id={p.id} label={p.label} color={colorResaltado} />
          </Animated.View>
        </PressableSuave>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    height: ALTO,
    borderRadius: ALTO / 2,
    padding: MARGEN,
    // Un poco menos ancha que la pantalla
    marginHorizontal: MARGEN_LATERAL,
  },
  pildora: {
    position: "absolute",
    top: MARGEN,
    bottom: MARGEN,
    left: MARGEN,
    borderRadius: ALTO / 2 - MARGEN,
  },
  mitad: { flex: 1, alignItems: "center", justifyContent: "center" },
  capaResaltada: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  contenido: { flexDirection: "row", alignItems: "center", gap: 7 },
  texto: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
