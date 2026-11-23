import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

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

/** Orden de las tarjetas: todas cuadradas, una al lado de otra */
const ORDEN: CategoryId[] = [
  "donacion",
  "cambio",
  "venta",
  "mascota",
  "comida",
];
/** Separación entre tarjetas y margen de la lista del inicio a cada lado */
const SEPARACION = 14;
const MARGEN_LISTA = 16;

/** El tono con transparencia (`alfa` de 0 a 1), en hex de 8 dígitos */
function conAlfa(tono: string, alfa: number) {
  return (
    tono +
    Math.round(alfa * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

const ALTO_TARJETA = 118;
const CIRCULO = 132;
const ICONO = 68;

const TarjetaCategoria = memo(function TarjetaCategoria({
  category,
  selected,
  onToggle,
  ancho,
}: {
  category: (typeof CATEGORIES)[number];
  selected: boolean;
  onToggle: (category: CategoryId) => void;
  /** Ancho de la tarjeta (las cinco miden lo mismo) */
  ancho: number;
}) {
  const { isDark } = useAppTheme();
  const tono = TONOS[category.id];

  // Sin brinco ni borde: al tocarla (y mientras está elegida) se oscurece un poco
  return (
    <View style={{ width: ancho }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={category.label}
        onPress={() => onToggle(category.id)}
        // Se oscurece en cuanto el dedo la toca, sin esperar
        unstable_pressDelay={0}
        style={[
          styles.tarjeta,
          { backgroundColor: conAlfa(tono, isDark ? 0.16 : 0.12) },
        ]}
      >
        {({ pressed }) => (
          <>
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
              style={[
                styles.etiqueta,
                { color: isDark ? "#F5F5F5" : "#14141A" },
              ]}
            >
              {category.label}
            </Text>
            <Image
              source={CATEGORY_IMAGES_CRISTAL[category.id]}
              contentFit="contain"
              style={styles.icono}
            />
            {/* Velo oscuro suave: al presionar y en la elegida */}
            {pressed || selected ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? "rgba(0,0,0,0.22)"
                      : "rgba(0,0,0,0.07)",
                  },
                ]}
              />
            ) : null}
          </>
        )}
      </Pressable>
    </View>
  );
});

/** Categorías del inicio en tarjetas cuadradas, una al lado de otra (se desliza para ver todas); tocar una la activa y volver a tocarla la desactiva. */
export function CategoryRow({
  activeCategory,
  onToggleCategory,
}: {
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
}) {
  // Lo bastante anchas para que el nombre más largo ("Intercambios") quepa sin achicarse: todos
  // los nombres con el mismo tamaño. Caben dos y un pedazo de la tercera, lo que invita a deslizar
  const { width } = useWindowDimensions();
  const ancho = Math.floor(
    (Math.min(width, 760) - MARGEN_LISTA * 2 - SEPARACION * 3) / 2.3,
  );

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
      requestAnimationFrame(() => onToggleCategory(id));
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
        <TarjetaCategoria
          key={category.id}
          category={category}
          selected={elegida === category.id}
          onToggle={alElegir}
          ancho={ancho}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 16, marginHorizontal: -MARGEN_LISTA },
  fila: { gap: SEPARACION, paddingHorizontal: MARGEN_LISTA },
  tarjeta: {
    height: ALTO_TARJETA,
    borderRadius: 22,
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
