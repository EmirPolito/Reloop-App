import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import {
  ALTO_PILDORA,
  PildoraCristal,
} from "@/features/busqueda/components/PildoraCristal";

/** Lado de los botones redondos del encabezado: el alto de los buscadores */
export const LADO_BOTON_BARRA = ALTO_PILDORA;

/**
 * Botón redondo de cristal del encabezado (volver, eliminar...), igual al botón de volver
 * del módulo de búsqueda.
 */
export function BotonBarra({
  etiqueta,
  onPress,
  disabled = false,
  peligro = false,
  fondo,
  opaco = false,
  colorPeligro = "#FF8A1F",
  children,
}: {
  etiqueta: string;
  onPress: () => void;
  disabled?: boolean;
  /** Fondo naranja (acción que elimina) */
  peligro?: boolean;
  /**
   * Fondo sólido en lugar del cristal translúcido (p. ej., sobre la capa del encabezado del
   * chat, que lo teñía de gris)
   */
  fondo?: string;
  /** Cristal casi opaco, más blanco (ver `fondoCristalVisto`): no se agrisa sobre el desenfoque */
  opaco?: boolean;
  /** Color del fondo cuando es `peligro` (naranja si no se indica) */
  colorPeligro?: string;
  children: ReactNode;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.92}
      style={disabled && styles.apagado}
    >
      <PildoraCristal
        contentStyle={styles.boton}
        relleno={peligro ? colorPeligro : fondo}
        opaco={opaco}
      >
        {children}
      </PildoraCristal>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: LADO_BOTON_BARRA,
    height: LADO_BOTON_BARRA,
    minHeight: LADO_BOTON_BARRA,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  apagado: { opacity: 0.45 },
});
