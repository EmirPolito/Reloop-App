import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  fondoCristalSuave,
  sombraCristalSuave,
} from "@/components/ui/cristalSuave";
import { coloresCristal } from "@/features/busqueda/components/PildoraCristal";
import { colorElegida } from "@/features/busqueda/components/PildoraOpcion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export interface OpcionFiltro<T extends string> {
  id: T;
  texto: string;
}

/** Más bajita que el buscador (50), para que no se vean del mismo tamaño */
const ALTO = 38;
const MARGEN = 4;
/** Alto de cada opción (y de la píldora que marca la elegida) */
const ALTO_OPCION = ALTO - MARGEN * 2 - 2;
/** Recorrido de la píldora elegida: rápido y sin rebote, frena suave al llegar */
const RECORRIDO = { duration: 240, easing: Easing.bezier(0.25, 1, 0.5, 1) };

/**
 * Píldoras de filtro en una sola barra de cristal, como las de chats (fondo translúcido, borde
 * de luz y sombra suave), pero con scroll a los lados: cada opción mide lo que su texto, así
 * la última asoma cortada a la derecha y se nota que hay más. La elegida se marca con una sola
 * píldora oscura (en oscuro, clara) que se recorre hasta ella y toma su ancho, en el hilo de
 * UI; el texto cambia a blanco al mismo tiempo. Al elegir una, la fila se desplaza para dejarla
 * al centro. La usan notificaciones y favoritos.
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
  const elegida = colorElegida(isDark);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [anchoVista, setAnchoVista] = useState(0);
  const posiciones = useRef<Record<string, { x: number; ancho: number }>>({});
  // Dónde está y cuánto mide la píldora que marca la elegida (-1: aún sin medir)
  const marcaX = useSharedValue(-1);
  const marcaAncho = useSharedValue(0);

  /** Lleva la marca a una opción: de golpe la primera vez, recorriéndose las demás */
  const moverMarca = (id: string, animar: boolean) => {
    const pos = posiciones.current[id];
    if (!pos) return;
    if (!animar || marcaX.get() < 0) {
      marcaX.set(pos.x);
      marcaAncho.set(pos.ancho);
    } else {
      marcaX.set(withTiming(pos.x, RECORRIDO));
      marcaAncho.set(withTiming(pos.ancho, RECORRIDO));
    }
  };

  // Si el filtro cambia desde fuera (o cambian los textos), la marca lo sigue
  useEffect(() => {
    moverMarca(activo, true);
    // moverMarca solo lee refs y valores compartidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  const elegir = (id: T) => {
    // La marca se recorre sola al cambiar `activo` (ver el efecto de arriba)
    onCambiar(id);
    const pos = posiciones.current[id];
    if (pos && anchoVista > 0) {
      scroll.current?.scrollTo({
        x: Math.max(0, pos.x + pos.ancho / 2 - anchoVista / 2),
        animated: true,
      });
    }
  };

  const estiloMarca = useAnimatedStyle(() => ({
    opacity: marcaX.get() < 0 ? 0 : 1,
    width: marcaAncho.get(),
    transform: [{ translateX: Math.max(0, marcaX.get()) }],
  }));

  return (
    // La sombra va por fuera: el recorte del cristal la cortaría
    <View style={styles.sombra}>
      <View
        style={[
          styles.barra,
          {
            backgroundColor: fondoCristalSuave(isDark),
            borderColor: coloresCristal(isDark).borde,
          },
        ]}
      >
        {/* Sin desenfoque, igual que la barra de chats: con él el blanco se notaba más */}
        <ScrollView
          ref={scroll}
          horizontal
          accessibilityRole="tablist"
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={(e: LayoutChangeEvent) =>
            setAnchoVista(e.nativeEvent.layout.width)
          }
          contentContainerStyle={styles.contenido}
        >
          {/* Una sola píldora que se recorre detrás de las opciones */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.marca,
              { backgroundColor: elegida.fondo },
              estiloMarca,
            ]}
          />
          {opciones.map((opcion) => (
            <Opcion
              key={opcion.id}
              texto={opcion.texto}
              activa={activo === opcion.id}
              isDark={isDark}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                posiciones.current[opcion.id] = { x, ancho: width };
                // Al medirse la elegida (al montar o si cambia su texto), la marca toma su lugar
                if (opcion.id === activo) moverMarca(opcion.id, false);
              }}
              onPress={() => elegir(opcion.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/** Una opción: solo el texto, que pasa a blanco al mismo ritmo que llega la marca */
function Opcion({
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
  const color = isDark ? "#C4C7CC" : "#6B6B72";

  const progreso = useDerivedValue(
    () => withTiming(activa ? 1 : 0, RECORRIDO),
    [activa],
  );
  const estiloTexto = useAnimatedStyle(() => ({
    color: interpolateColor(progreso.get(), [0, 1], [color, elegida.texto]),
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      onLayout={onLayout}
      style={styles.opcion}
    >
      <Animated.Text style={[styles.texto, estiloTexto]}>{texto}</Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Mismo espacio arriba y abajo que antes (la neblina de la cabecera cuenta con él)
  sombra: {
    marginHorizontal: 15,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 999,
    ...sombraCristalSuave,
  },
  barra: {
    height: ALTO,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  contenido: { padding: MARGEN, gap: 2 },
  // Medida desde el borde del contenido: las posiciones de las opciones ya incluyen el margen
  marca: {
    position: "absolute",
    top: MARGEN,
    left: 0,
    height: ALTO_OPCION,
    borderRadius: 999,
  },
  opcion: {
    height: ALTO_OPCION,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  // La misma letra que las píldoras de chats
  texto: { fontFamily: "Poppins_500Medium", fontSize: 14 },
});
