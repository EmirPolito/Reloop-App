import { memo, type PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/features/shared/Text";
import { PildoraCristal } from "./PildoraCristal";

/** Alto de las píldoras de debajo de los buscadores */
export const ALTO_PILDORA_OPCION = 38;

/**
 * Sombra de las píldoras: más corta que la del buscador. Van en una fila con scroll, que recorta
 * lo que sale de ella; con la sombra larga quedaba un corte (dos tonos) bajo las píldoras.
 */
export const sombraPildora = {
  shadowOpacity: 0.05,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 0 },
} as const;

/** Fondo y texto de una píldora elegida */
export function colorElegida(isDark: boolean) {
  return isDark
    ? { fondo: "#F1F5F9", texto: "#101010" }
    : { fondo: "#101010", texto: "#FFFFFF" };
}

/** Píldora de cristal de debajo del buscador (ideas de búsqueda o categorías) */
function PildoraOpcionBase<T extends string>({
  valor,
  etiqueta,
  seleccionado,
  isDark,
  onPress,
  sutil = false,
}: {
  valor: T;
  etiqueta: string;
  seleccionado: boolean;
  isDark: boolean;
  onPress: (valor: T) => void;
  /** Con una sombra mínima: apenas levantada (las categorías de los resultados de búsqueda) */
  sutil?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
      scaleTo={0.97}
      onPress={() => onPress(valor)}
    >
      <PildoraCristal
        style={sutil ? styles.sombraSutil : sombraPildora}
        contentStyle={styles.pildora}
        opaco
        relleno={seleccionado ? colorElegida(isDark).fondo : undefined}
      >
        <Text
          style={[
            styles.texto,
            {
              color: seleccionado
                ? colorElegida(isDark).texto
                : isDark
                  ? "#F1F5F9"
                  : "#181818ff",
            },
          ]}
        >
          {etiqueta}
        </Text>
      </PildoraCristal>
    </PressableScale>
  );
}
export const PildoraOpcion = memo(
  PildoraOpcionBase,
) as typeof PildoraOpcionBase;

/** Fila horizontal de píldoras, con el mismo ancho y márgenes que el buscador */
export function FilaPildoras({ children }: PropsWithChildren) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.fila}
      contentContainerStyle={styles.filaContenido}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sombraSutil: {
    shadowOpacity: 0.035,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  pildora: {
    minHeight: ALTO_PILDORA_OPCION,
    height: ALTO_PILDORA_OPCION,
    paddingHorizontal: 22,
    paddingVertical: 0,
    justifyContent: "center",
  },
  texto: { fontSize: 13.5, fontWeight: "500" },
  fila: { width: "100%", maxWidth: 760, alignSelf: "center", marginBottom: -4 },
  // Margen arriba y abajo para que no se corte la sombra de las píldoras
  filaContenido: {
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 8,
    // Lo bastante para que la sombra no se recorte; el margen negativo de la fila lo compensa
    paddingBottom: 12,
  },
});
