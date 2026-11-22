import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";
import { CATEGORIES, categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { CATEGORY_IMAGES_CRISTAL } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";

/** Tono de cada tarjeta (rosa, violeta, azul, naranja y verde) */
const TONOS: Record<CategoryId, string> = {
  venta: "#FF6B8E",
  cambio: "#9B6BFF",
  donacion: "#3EA2FF",
  mascota: "#FFA53A",
  comida: "#3FC46E",
};

/** Orden de las tarjetas: 2 rectángulos arriba y 3 cuadros abajo */
const FILAS: CategoryId[][] = [
  ["donacion", "cambio"],
  ["venta", "mascota", "comida"],
];

/** El tono con transparencia (`alfa` de 0 a 1), en hex de 8 dígitos */
function conAlfa(tono: string, alfa: number) {
  return (
    tono +
    Math.round(alfa * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

const ALTO_TARJETA = 104;
const CIRCULO = 120;
const ICONO = 62;

const TarjetaCategoria = memo(function TarjetaCategoria({
  category,
  selected,
  onToggle,
}: {
  category: (typeof CATEGORIES)[number];
  selected: boolean;
  onToggle: (category: CategoryId) => void;
}) {
  const { isDark } = useAppTheme();
  const tono = TONOS[category.id];

  // Al tocarla se hunde un poco y al soltarla brinca (resorte con un pequeño rebote)
  const escala = useSharedValue(1);
  const estiloEscala = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  return (
    <Animated.View style={[styles.celda, estiloEscala]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={category.label}
        onPress={() => onToggle(category.id)}
        onPressIn={() => {
          escala.set(withTiming(0.96, { duration: 70, easing: EASE_OUT }));
        }}
        onPressOut={() => {
          escala.set(withSpring(1, { damping: 18, stiffness: 520, mass: 0.5 }));
        }}
        style={[
          styles.tarjeta,
          {
            backgroundColor: conAlfa(tono, isDark ? 0.16 : 0.12),
            // La activa se distingue con un borde de su color
            borderColor: selected ? conAlfa(tono, 0.7) : "transparent",
          },
        ]}
      >
        {/* Círculo de fondo: más intenso arriba y se desvanece hacia abajo */}
        <LinearGradient
          colors={[
            conAlfa(tono, isDark ? 0.5 : 0.45),
            conAlfa(tono, isDark ? 0.22 : 0.18),
            conAlfa(tono, 0.04),
          ]}
          locations={[0, 0.4, 1]}
          style={styles.circulo}
        />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.etiqueta, { color: isDark ? "#F5F5F5" : "#14141A" }]}
        >
          {category.label}
        </Text>
        <Image
          source={CATEGORY_IMAGES_CRISTAL[category.id]}
          contentFit="contain"
          style={styles.icono}
        />
      </Pressable>
    </Animated.View>
  );
});

/** Categorías del inicio en tarjetas (2 arriba y 3 abajo); tocar una la activa y volver a tocarla la desactiva. */
export function CategoryRow({
  activeCategory,
  onToggleCategory,
}: {
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
}) {
  return (
    <View style={styles.contenedor}>
      {FILAS.map((fila, i) => (
        <View key={i} style={styles.fila}>
          {fila
            .map((id) => categoryFor(id))
            .map((category) => (
              <TarjetaCategoria
                key={category.id}
                category={category}
                selected={activeCategory === category.id}
                onToggle={onToggleCategory}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 6, gap: 10 },
  fila: { flexDirection: "row", gap: 10 },
  celda: { flex: 1, minWidth: 0 },
  tarjeta: {
    height: ALTO_TARJETA,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    padding: 12,
  },
  circulo: {
    position: "absolute",
    width: CIRCULO,
    height: CIRCULO,
    borderRadius: CIRCULO / 2,
    right: -CIRCULO * 0.3,
    bottom: -CIRCULO * 0.42,
  },
  etiqueta: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  icono: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: ICONO,
    height: ICONO,
  },
});
