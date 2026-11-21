import { useRef, useState, type ComponentRef } from "react";
import { ScrollView, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { PildoraCristal } from "@/features/busqueda/components/PildoraCristal";
import {
  ALTO_PILDORA_OPCION,
  colorElegida,
  sombraPildora,
} from "@/features/busqueda/components/PildoraOpcion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export interface OpcionFiltro<T extends string> {
  id: T;
  texto: string;
}

/**
 * Píldoras de filtro de cristal con scroll a los lados (notificaciones, favoritos y chats),
 * iguales a las del módulo de búsqueda. Al elegir una, la
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
  const elegida = colorElegida(isDark);
  const color = isDark ? "#F1F5F9" : "#101010";

  const progreso = useDerivedValue(
    () => withTiming(activa ? 1 : 0, { duration: 200 }),
    [activa],
  );
  // El relleno de la elegida aparece encima del cristal
  const estiloRelleno = useAnimatedStyle(() => ({ opacity: progreso.get() }));
  const estiloTexto = useAnimatedStyle(() => ({
    color: interpolateColor(progreso.get(), [0, 1], [color, elegida.texto]),
  }));

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      onLayout={onLayout}
      scaleTo={0.97}
    >
      <PildoraCristal style={sombraPildora} contentStyle={styles.pildora} opaco>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: elegida.fondo },
            estiloRelleno,
          ]}
        />
        <Animated.Text style={[styles.texto, estiloTexto]}>
          {texto}
        </Animated.Text>
      </PildoraCristal>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  // Un poco más pegadas al buscador; abajo, espacio para la sombra
  contenido: {
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pildora: {
    minHeight: ALTO_PILDORA_OPCION,
    height: ALTO_PILDORA_OPCION,
    paddingHorizontal: 22,
    paddingVertical: 0,
    justifyContent: "center",
  },
  // La misma letra que las píldoras del módulo de búsqueda (Text con fontWeight 500)
  texto: { fontFamily: "Poppins_500Medium", fontSize: 14 },
});
