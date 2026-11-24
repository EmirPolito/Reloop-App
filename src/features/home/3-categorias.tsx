import { Image } from "expo-image";
import { memo, useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";
import { CATEGORIES, categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";

/** Diseño de cada categoría: una píldora (imagen) con su icono y su nombre */
const PILDORAS: Record<CategoryId, number> = {
  venta: require("@/assets/images/categorias/ventas.png"),
  cambio: require("@/assets/images/categorias/intercambios.png"),
  donacion: require("@/assets/images/categorias/donaciones.png"),
  mascota: require("@/assets/images/categorias/adopciones.png"),
  comida: require("@/assets/images/categorias/comidas.png"),
};

/**
 * Aire transparente de cada imagen a los lados del cuerpo de la píldora (fracción del
 * ancho, medido en los PNG). Cada diseño trae uno distinto, por eso se recorta cada uno:
 * así todas quedan a la misma distancia y el toque no cae en la de al lado.
 */
const AIRE: Record<CategoryId, { izquierda: number; derecha: number }> = {
  venta: { izquierda: 0.169, derecha: 0.121 },
  cambio: { izquierda: 0.166, derecha: 0.16 },
  donacion: { izquierda: 0.168, derecha: 0.168 },
  mascota: { izquierda: 0.157, derecha: 0.102 },
  comida: { izquierda: 0.213, derecha: 0.23 },
};

/** Orden de las píldoras, una al lado de otra */
const ORDEN: CategoryId[] = [
  "donacion",
  "cambio",
  "venta",
  "mascota",
  "comida",
];
/** Margen de la lista del inicio a cada lado */
const MARGEN_LISTA = 16;
/** Tamaño de cada imagen (las cinco iguales, en proporción 3:1 como los diseños) */
const ANCHO_PILDORA = 168;
const ALTO_PILDORA = 56;
/** Distancia entre una píldora y la siguiente (de cuerpo a cuerpo) */
const SEPARACION = 6;
/**
 * Brinco al tocar: se hunde y rebota, todo después de soltar. Si se animara al apoyar el
 * dedo, al deslizar la fila la píldora se hundía y volvía mientras se movía (temblaba);
 * así deslizar nunca la anima.
 */
const HUNDIDA = 0.92;
const BAJADA = { duration: 70, easing: EASE_OUT };
const REBOTE = { damping: 11, stiffness: 320, mass: 0.6 };

const PildoraCategoria = memo(function PildoraCategoria({
  category,
  selected,
  atenuada,
  onToggle,
}: {
  category: (typeof CATEGORIES)[number];
  selected: boolean;
  /** Hay otra elegida: esta se ve más tenue */
  atenuada: boolean;
  onToggle: (category: CategoryId) => void;
}) {
  // Solo escala, en el hilo de UI: no vuelve a dibujar nada en React
  const escala = useSharedValue(1);
  const aire = AIRE[category.id];
  const estiloBrinco = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.label}
      onPress={() => {
        escala.set(
          withSequence(withTiming(HUNDIDA, BAJADA), withSpring(1, REBOTE)),
        );
        onToggle(category.id);
      }}
      // Solo el cuerpo de la píldora: el aire de la imagen sobresale sin recibir toques
      style={{
        width: ANCHO_PILDORA * (1 - aire.izquierda - aire.derecha),
        height: ALTO_PILDORA,
        opacity: atenuada ? 0.45 : 1,
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, estiloBrinco]}>
        <Image
          source={PILDORAS[category.id]}
          contentFit="contain"
          style={[styles.pildora, { left: -ANCHO_PILDORA * aire.izquierda }]}
        />
      </Animated.View>
    </Pressable>
  );
});

/** Categorías del inicio en píldoras, una al lado de otra (se desliza para ver todas); tocar una la activa y volver a tocarla la desactiva. Con una elegida, las demás se atenúan. */
export const CategoriasInicio = memo(function CategoriasInicio({
  activeCategory,
  onToggleCategory,
}: {
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
}) {
  // La elegida se marca en el mismo toque (estado propio) y el filtro, que vuelve a dibujar
  // todo el inicio, se aplica un cuadro después: así el toque responde al instante.
  // Si la categoría cambia desde otro lado (las píldoras, limpiar filtros), se sigue a esa
  const [elegida, setElegida] = useState(activeCategory);
  const [activaAntes, setActivaAntes] = useState(activeCategory);
  if (activaAntes !== activeCategory) {
    setActivaAntes(activeCategory);
    setElegida(activeCategory);
  }
  const alElegir = useCallback(
    (id: CategoryId) => {
      setElegida((actual) => (actual === id ? null : id));
      // Marcada en el mismo toque; el filtro lo aplica la pantalla con su transición
      onToggleCategory(id);
    },
    [onToggleCategory],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Llegan hasta las orillas de la pantalla, con el margen de la lista al inicio y al final
      style={styles.contenedor}
      contentContainerStyle={styles.fila}
    >
      {ORDEN.map((id) => categoryFor(id)).map((category) => (
        <PildoraCategoria
          key={category.id}
          category={category}
          selected={elegida === category.id}
          atenuada={elegida !== null && elegida !== category.id}
          onToggle={alElegir}
        />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  contenedor: { marginTop: 8, marginHorizontal: -MARGEN_LISTA },
  fila: { gap: SEPARACION, paddingHorizontal: MARGEN_LISTA },
  pildora: {
    position: "absolute",
    top: 0,
    width: ANCHO_PILDORA,
    height: ALTO_PILDORA,
  },
});
