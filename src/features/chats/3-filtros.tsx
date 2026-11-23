import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";
import { coloresCristal } from "@/features/busqueda/components/PildoraCristal";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { colorElegida } from "@/features/busqueda/components/PildoraOpcion";
import {
  fondoCristalSuave,
  sombraCristalSuave,
} from "@/components/ui/cristalSuave";

const ALTO = 40;
const MARGEN = 4;

/**
 * Píldoras de filtro en una sola barra a lo ancho, con el cristal de los botones de arriba
 * (fondo translúcido, desenfoque, borde de luz y su sombra): cada opción ocupa lo mismo y una píldora oscura marca la
 * elegida, deslizándose de una a otra.
 */
export function PildorasSegmentadas<T extends string>({
  opciones,
  activo,
  onCambiar,
}: {
  opciones: { id: T; texto: string }[];
  activo: T;
  onCambiar: (id: T) => void;
}) {
  const { isDark } = useAppTheme();
  const [ancho, setAncho] = useState(0);
  const anchoOpcion = ancho > 0 ? ancho / opciones.length : 0;
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.id === activo),
  );

  const x = useDerivedValue(
    () => withTiming(indice * anchoOpcion, { duration: 220, easing: EASE_OUT }),
    [indice, anchoOpcion],
  );
  const estiloMarca = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  // El mismo cristal que los botones de arriba (sin su sombra)
  // La elegida: fondo oscuro con letra blanca (en oscuro, al revés), como en favoritos
  const texto = colorElegida(isDark).texto;
  const apagado = isDark ? "#C4C7CC" : "#6B6B72";

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
        {/* Sin desenfoque: detrás solo hay el fondo liso (y aligera la transición del módulo) */}
        <View
          accessibilityRole="tablist"
          style={styles.fila}
          onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        >
          {anchoOpcion > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.marca,
                {
                  width: anchoOpcion,
                  backgroundColor: colorElegida(isDark).fondo,
                },
                estiloMarca,
              ]}
            />
          ) : null}
          {opciones.map((opcion) => {
            const elegida = opcion.id === activo;
            return (
              <Pressable
                key={opcion.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: elegida }}
                onPress={() => onCambiar(opcion.id)}
                style={styles.opcion}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.texto, { color: elegida ? texto : apagado }]}
                >
                  {opcion.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Un poco más abajo del carrusel, y con aire antes de la tarjeta de los chats. Misma sombra
  // que los botones de arriba: sin ella el cristal casi no se distingue del fondo
  sombra: {
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 999,
    ...sombraCristalSuave,
  },
  barra: {
    overflow: "hidden",
    borderWidth: 1,
    height: ALTO,
    padding: MARGEN,
    borderRadius: 999,
  },
  fila: { flex: 1, flexDirection: "row" },
  marca: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  opcion: { flex: 1, alignItems: "center", justifyContent: "center" },
  texto: { fontFamily: "Poppins_500Medium", fontSize: 14 },
});
