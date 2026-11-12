import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";

/** Fila larga de ajustes: icono + texto a la izquierda, switch o flecha a la derecha */
export function FilaAjuste({
  icon,
  label,
  right,
  onPress,
  bg,
  textColor,
  iconWidth,
}: {
  icon: ReactNode;
  label: string;
  right: ReactNode;
  onPress?: () => void;
  bg: string;
  textColor: string;
  /** Ancho del contenedor del icono (por defecto 20). Súbelo si el icono se corta */
  iconWidth?: number;
}) {
  const content = (
    <>
      <View style={[styles.rowIcon, iconWidth ? { width: iconWidth } : null]}>
        {icon}
      </View>
      <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      {right}
    </>
  );

  // Sin onPress (filas con switch o con círculos) la fila no es botón: el control recibe el toque
  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: bg }]}>{content}</View>;
  }
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, { backgroundColor: bg }]}
    >
      {content}
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  // configuracion del contenido de las tarjetas de General y Legal
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 55,
    borderRadius: 17,
    paddingHorizontal: 15,
    gap: 13.5,
  },
  rowIcon: { width: 20, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
});
