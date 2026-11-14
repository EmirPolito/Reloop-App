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
import { coloresTarjeta } from "../perfilEstilos";

export type Pestana = "publicaciones" | "anuncios";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "publicaciones", label: "Publicaciones" },
  { id: "anuncios", label: "Anuncios" },
];

/**
 * Rayita: ease-out fuerte y corto. Arranca rápido (responde al toque al instante) y frena
 * suave al llegar. withTiming se puede interrumpir: si tocas otra pestaña a medio camino,
 * cambia de rumbo desde donde va.
 */
const MOVIMIENTO = { duration: 220, easing: Easing.bezier(0.23, 1, 0.32, 1) };

/**
 * Fila de pestañas Publicaciones / Anuncios con su rayita animada y el divisor de abajo.
 * Se dibuja dos veces en el perfil (la de su lugar y la que queda fija bajo el header), las
 * dos gobernadas por el mismo estado `activa`.
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
  const { texto, divisor } = coloresTarjeta(isDark);
  // Pestaña no seleccionada: gris visible sobre el fondo (no blanco, o desaparece)
  const inactivo = isDark ? "#64748B" : "#AEAEB2";

  const indice = PESTANAS.findIndex((p) => p.id === activa);
  const columna = ancho / PESTANAS.length;
  // La línea cubre toda la columna de borde a borde
  const destino = indice * columna;

  // La primera vez se coloca directo; después se desliza al cambiar de pestaña
  const x = useSharedValue<number | null>(null);
  useEffect(() => {
    if (ancho <= 0) return;
    x.set(x.get() === null ? destino : withTiming(destino, MOVIMIENTO));
  }, [ancho, destino, x]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value ?? 0 }],
  }));

  return (
    <View>
      <View
        accessibilityRole="tablist"
        style={styles.fila}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      >
        {PESTANAS.map((p) => {
          const seleccionada = p.id === activa;
          const color = seleccionada ? texto : inactivo;
          return (
            <PressableSuave
              key={p.id}
              accessibilityRole="tab"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: seleccionada }}
              onPress={() => onCambiar(p.id)}
              style={styles.pestana}
            >
              {p.id === "publicaciones" ? (
                <IconoPublicaciones size={22} color={color} />
              ) : (
                <IconoAnuncios size={20} color={color} />
              )}
              <Text style={[styles.etiqueta, { color }]}>{p.label}</Text>
            </PressableSuave>
          );
        })}

        {ancho > 0 ? (
          <Animated.View
            style={[
              styles.indicador,
              { backgroundColor: texto, width: columna },
              estiloIndicador,
            ]}
          />
        ) : null}
      </View>
      <View style={[styles.divisor, { backgroundColor: divisor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    width: "100%",
  },
  pestana: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  indicador: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: 2,
  },
  etiqueta: { fontFamily: "Inter_600SemiBold", fontSize: 14, top: 1 },
  divisor: { height: StyleSheet.hairlineWidth },
});
