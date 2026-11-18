import { useRef, useState, type ComponentRef } from "react";
import {
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export interface OpcionFiltro<T extends string> {
  id: T;
  texto: string;
}

/**
 * Píldoras de filtro con scroll a los lados (notificaciones y favoritos). Al elegir una, la
 * fila se desplaza para dejarla al centro, sin volver al principio, así las últimas también
 * quedan a la vista. El color de la elegida pasa de uno a otro con una animación corta.
 */
export function FiltrosPildoras<T extends string>({
  opciones,
  activo,
  onCambiar,
}: {
  opciones: OpcionFiltro<T>[];
  activo: T;
  onCambiar: (id: T) => void;
}) {
  const { isDark } = useAppTheme();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [anchoVista, setAnchoVista] = useState(0);
  const posiciones = useRef<Record<string, { x: number; ancho: number }>>({});

  const elegir = (id: T) => {
    onCambiar(id);
    const pos = posiciones.current[id];
    if (pos && anchoVista > 0) {
      scroll.current?.scrollTo({
        x: Math.max(0, pos.x + pos.ancho / 2 - anchoVista / 2),
        animated: true,
      });
    }
  };

  return (
    <ScrollView
      ref={scroll}
      horizontal
      accessibilityRole="tablist"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onLayout={(e: LayoutChangeEvent) =>
        setAnchoVista(e.nativeEvent.layout.width)
      }
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
    >
      {opciones.map((opcion) => (
        <Pildora
          key={opcion.id}
          texto={opcion.texto}
          activa={activo === opcion.id}
          isDark={isDark}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            posiciones.current[opcion.id] = { x, ancho: width };
          }}
          onPress={() => elegir(opcion.id)}
        />
      ))}
    </ScrollView>
  );
}

function Pildora({
  texto,
  activa,
  isDark,
  onPress,
  onLayout,
}: {
  texto: string;
  activa: boolean;
  isDark: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const fondoActiva = isDark ? "#F1F5F9" : "#101010";
  const fondo = isDark ? "#ffffff14" : "#FFFFFF";
  const colorActiva = isDark ? "#101010" : "#FFFFFF";
  const color = isDark ? "#CBD5E1" : "#4B5563";

  const progreso = useDerivedValue(
    () => withTiming(activa ? 1 : 0, { duration: 200 }),
    [activa],
  );
  const estiloFondo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progreso.get(),
      [0, 1],
      [fondo, fondoActiva],
    ),
  }));
  const estiloTexto = useAnimatedStyle(() => ({
    color: interpolateColor(progreso.get(), [0, 1], [color, colorActiva]),
  }));

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      onLayout={onLayout}
      scaleTo={0.94}
    >
      <Animated.View style={[styles.pildora, estiloFondo]}>
        <Animated.Text style={[styles.texto, estiloTexto]}>{texto}</Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  contenido: {
    gap: 8,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 20,
  },
  pildora: {
    height: 38,
    paddingHorizontal: 17,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { fontFamily: "Inter_500Medium", fontSize: 13.5 },
});
