import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

/**
 * Resorte amortiguado: se desliza rápido y frena en seco con un rebote mínimo,
 * evitando oscilaciones al cambiar de pestaña.
 */
const RESORTE_DESPLAZAMIENTO = {
  damping: 28,
  stiffness: 260,
  mass: 0.85,
};

/**
 * Selector tipo píldora para Publicaciones / Anuncios.
 * Combina dos tonos (base suave y píldora activa en negro fuerte) cubriendo
 * exactamente el 50 % sin espacio alrededor.
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

  // Paleta de 2 tonos en negro:
  // 1. Tono suave para el contenedor base
  const tonoSuave = isDark ? "#222225" : "#ECECEE";
  // 2. Tono fuerte (negro sólido) para la píldora activa
  const tonoFuerte = "#000000";

  // Colores de icono y texto según estado
  const colorActivo = "#FFFFFF";
  const colorInactivo = isDark ? "#8E8E93" : "#52525B";

  const indice = PESTANAS.findIndex((p) => p.id === activa);
  const columna = ancho / PESTANAS.length;
  const destino = indice * columna;

  // Posición horizontal de la píldora activa
  const x = useSharedValue<number | null>(null);
  // Escala sutil para el efecto táctil al presionar
  const escala = useSharedValue(1);

  useEffect(() => {
    if (ancho <= 0) return;
    x.set(
      x.get() === null ? destino : withSpring(destino, RESORTE_DESPLAZAMIENTO),
    );
  }, [ancho, destino, x]);

  const estiloPildoraActiva = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value ?? 0 }, { scale: escala.value }],
  }));

  const manejarPressIn = () => {
    escala.set(withTiming(0.97, { duration: 100 }));
  };

  const manejarPressOut = () => {
    escala.set(withSpring(1, { damping: 24, stiffness: 280 }));
  };

  return (
    <View style={styles.contenedorExterno}>
      <View
        accessibilityRole="tablist"
        style={[styles.pildoraBase, { backgroundColor: tonoSuave }]}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      >
        {/* Fondo negro activo que cubre exactamente la mitad sin espacios */}
        {ancho > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pildoraActiva,
              {
                backgroundColor: tonoFuerte,
                width: columna,
              },
              estiloPildoraActiva,
            ]}
          />
        ) : null}

        {PESTANAS.map((p) => {
          const seleccionada = p.id === activa;
          const color = seleccionada ? colorActivo : colorInactivo;

          return (
            <PressableSuave
              key={p.id}
              accessibilityRole="tab"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: seleccionada }}
              onPressIn={manejarPressIn}
              onPressOut={manejarPressOut}
              onPress={() => onCambiar(p.id)}
              style={styles.pestana}
            >
              {p.id === "publicaciones" ? (
                <IconoPublicaciones size={18} color={color} />
              ) : (
                <IconoAnuncios size={17} color={color} />
              )}
              <Text style={[styles.etiqueta, { color }]}>{p.label}</Text>
            </PressableSuave>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorExterno: {
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  pildoraBase: {
    flexDirection: "row",
    width: "100%",
    height: 38,
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
  },
  pildoraActiva: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  pestana: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  etiqueta: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    top: 0.5,
  },
});
