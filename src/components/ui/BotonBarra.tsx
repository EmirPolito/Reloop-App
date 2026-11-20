import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Lado de los botones redondos del encabezado */
export const LADO_BOTON_BARRA = 48;

/**
 * Botón redondo del encabezado (volver, eliminar...): el borde es del mismo color que el
 * fondo, así no se ve ningún aro.
 */
export function BotonBarra({
  etiqueta,
  onPress,
  disabled = false,
  peligro = false,
  colorPeligro = "#FF8A1F",
  children,
}: {
  etiqueta: string;
  onPress: () => void;
  disabled?: boolean;
  /** Fondo naranja (acción que elimina) */
  peligro?: boolean;
  /** Color del fondo cuando es `peligro` (naranja si no se indica) */
  colorPeligro?: string;
  children: ReactNode;
}) {
  const { isDark } = useAppTheme();
  const fondo = peligro ? colorPeligro : isDark ? "#ffffff1a" : "#ffffffb7";
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.92}
      style={[
        styles.boton,
        { backgroundColor: fondo, borderColor: "transparent" },
        disabled && { opacity: 0.45 },
      ]}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: LADO_BOTON_BARRA,
    height: LADO_BOTON_BARRA,
    borderRadius: LADO_BOTON_BARRA / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
