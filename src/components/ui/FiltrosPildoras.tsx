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
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export interface OpcionFiltro<T extends string> {
  id: T;
  texto: string;
}

/** Alto de cada píldora: más bajita que el buscador (50) */
const ALTO = 36;
/** Cambio de color al elegir: rápido y sin rebote, frena suave al llegar */
const CAMBIO = { duration: 240, easing: Easing.bezier(0.25, 1, 0.5, 1) };

/** Colores de las píldoras: grises sueltas, y la elegida #101010 con texto blanco (en oscuro, al revés) */
function coloresPildora(isDark: boolean) {
  return {
    fondo: isDark ? "#2C2C2E" : "#F0F0F2",
    texto: isDark ? "#C4C7CC" : "#6B6B72",
    fondoActiva: isDark ? "#ffffff" : "#101010",
    textoActiva: isDark ? "#101010" : "#FFFFFF",
  };
}

/**
 * Píldoras de filtro sueltas, cada una con su fondo gris, con scroll a los lados: cada opción
 * mide lo que su texto, así la última asoma cortada a la derecha y se nota que hay más. La
 * elegida pasa a #101010 con texto blanco. Al elegir una, la fila se desplaza para dejarla al
 * centro. La usan notificaciones, favoritos y chats. Con `enMarco` van dentro de un marco de
 * cristal redondo del ancho de la tarjeta de chats: ahí las demás no llevan fondo (se ve el
 * del marco) y una sola píldora se desliza hasta la elegida, en el hilo de UI.
 */
export function FiltrosPildoras<T extends string>({
  opciones,
  activo,
  onCambiar,
  enMarco = false,
}: {
  opciones: OpcionFiltro<T>[];
  activo: T;
  onCambiar: (id: T) => void;
  enMarco?: boolean;
}) {
  const { isDark } = useAppTheme();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [anchoVista, setAnchoVista] = useState(0);
  const posiciones = useRef<Record<string, { x: number; ancho: number }>>({});
  // En el marco: dónde está y cuánto mide la píldora que se desliza (-1: aún sin medir)
  const marcaX = useSharedValue(-1);
  const marcaAncho = useSharedValue(0);

  /** Lleva la marca a una opción: de golpe la primera vez, deslizándose las demás */
  const moverMarca = (id: string, animar: boolean) => {
    const pos = posiciones.current[id];
    if (!pos) return;
    if (!animar || marcaX.get() < 0) {
      marcaX.set(pos.x);
      marcaAncho.set(pos.ancho);
    } else {
      marcaX.set(withTiming(pos.x, CAMBIO));
      marcaAncho.set(withTiming(pos.ancho, CAMBIO));
    }
  };

  // Si el filtro cambia (al tocar o desde fuera), la marca lo sigue
  useEffect(() => {
    moverMarca(activo, true);
    // moverMarca solo lee refs y valores compartidos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  const estiloMarca = useAnimatedStyle(() => ({
    opacity: marcaX.get() < 0 ? 0 : 1,
    width: marcaAncho.get(),
    transform: [{ translateX: Math.max(0, marcaX.get()) }],
  }));

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

  const fila = (
    <ScrollView
      ref={scroll}
      horizontal
      accessibilityRole="tablist"
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onLayout={(e: LayoutChangeEvent) =>
        setAnchoVista(e.nativeEvent.layout.width)
      }
      style={enMarco ? styles.filaEnMarco : styles.fila}
      contentContainerStyle={[
        styles.contenido,
        enMarco && styles.contenidoEnMarco,
      ]}
    >
      {/* En el marco, una sola píldora que se desliza detrás de las opciones */}
      {enMarco ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.marca,
            { backgroundColor: coloresPildora(isDark).fondoActiva },
            estiloMarca,
          ]}
        />
      ) : null}
      {opciones.map((opcion) => (
        <Opcion
          key={opcion.id}
          texto={opcion.texto}
          activa={activo === opcion.id}
          isDark={isDark}
          enMarco={enMarco}
          onLayout={(e) => {
            const { x, width } = e.nativeEvent.layout;
            posiciones.current[opcion.id] = { x, ancho: width };
            // Al medirse la elegida (al montar o si cambia el ancho), la marca toma su lugar
            if (opcion.id === activo) moverMarca(opcion.id, false);
          }}
          onPress={() => elegir(opcion.id)}
        />
      ))}
    </ScrollView>
  );

  if (!enMarco) return fila;

  return (
    // La sombra va por fuera: el recorte del cristal la cortaría
    <View style={styles.marcoSombra}>
      <View
        style={[
          styles.marco,
          {
            backgroundColor: fondoCristalSuave(isDark),
            borderColor: coloresCristal(isDark).borde,
          },
        ]}
      >
        {fila}
      </View>
    </View>
  );
}

/**
 * Una píldora: fondo y texto pasan de gris a los colores de la elegida. En el marco mide lo
 * mismo que las demás (se reparten el ancho en partes iguales) y no lleva
 * fondo propio: la marca que se desliza hace de fondo; solo cambia el color del texto.
 */
function Opcion({
  texto,
  activa,
  isDark,
  enMarco,
  onPress,
  onLayout,
}: {
  texto: string;
  activa: boolean;
  isDark: boolean;
  enMarco: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const colores = coloresPildora(isDark);

  const progreso = useDerivedValue(
    () => withTiming(activa ? 1 : 0, CAMBIO),
    [activa],
  );
  const estiloFondo = useAnimatedStyle(() => ({
    backgroundColor: enMarco
      ? "transparent"
      : interpolateColor(
          progreso.get(),
          [0, 1],
          [colores.fondo, colores.fondoActiva],
        ),
  }));
  const estiloTexto = useAnimatedStyle(() => ({
    color: interpolateColor(
      progreso.get(),
      [0, 1],
      [colores.texto, colores.textoActiva],
    ),
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      onLayout={onLayout}
      style={enMarco && styles.estirada}
    >
      <Animated.View
        style={[styles.opcion, enMarco && styles.opcionEstirada, estiloFondo]}
      >
        <Animated.Text style={[styles.texto, estiloTexto]}>
          {texto}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Mismo espacio arriba y abajo que antes (la neblina de la cabecera cuenta con él)
  fila: { marginTop: 20, marginBottom: 16, flexGrow: 0 },
  // Centradas si caben; si no, scroll desde la izquierda
  contenido: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 15, gap: 8 },
  // Marco de chats: mismo ancho, cristal y sombra que la tarjeta, pero bajito y redondo
  marcoSombra: {
    marginHorizontal: 12,
    // Más abajo y casi pegado a la tarjeta (ella suma 6 arriba)
    marginTop: 28,
    marginBottom: 6,
    borderRadius: 999,
    ...sombraCristalSuave,
  },
  marco: { borderWidth: 1, borderRadius: 999, overflow: "hidden" },
  filaEnMarco: { flexGrow: 0 },
  contenidoEnMarco: { paddingHorizontal: 5, paddingVertical: 5, gap: 5 },
  // Medida desde el borde del contenido: las posiciones de las opciones ya incluyen el margen
  marca: {
    position: "absolute",
    top: 5,
    left: 0,
    height: ALTO,
    borderRadius: 999,
  },
  // Todas del mismo ancho: se reparten el marco en partes iguales, sin importar el texto
  estirada: { flexGrow: 1, flexBasis: 0 },
  opcionEstirada: { alignItems: "center" },
  opcion: {
    height: ALTO,
    paddingHorizontal: 18,
    borderRadius: 999,
    justifyContent: "center",
  },
  texto: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
