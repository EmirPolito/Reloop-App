import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { COLORES_PERFIL, type ColorPerfil, TEMAS } from "../Perfiltemas";
import { IconoCheck } from "../Perfiliconos";

/** Círculos de color de la fila "Color": tamaño y separación (px).
 *  Si tienes muchos colores y no caben, baja TAM_CIRCULO_COLOR o GAP_CIRCULOS_COLOR. */
const TAM_CIRCULO_COLOR = 22;
const GAP_CIRCULOS_COLOR = 8;

/** Círculos pequeños de colores para la fila "Color" */
export const CirculosColor = memo(function CirculosColor({
  color,
  onColor,
}: {
  color: ColorPerfil;
  onColor: (color: ColorPerfil) => void;
}) {
  return (
    <View style={styles.circulosColor}>
      {COLORES_PERFIL.map((c) => {
        const selected = color === c;
        return (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Color ${TEMAS[c].label}`}
            onPress={() => onColor(c)}
            hitSlop={3}
            style={[styles.circuloColor, { backgroundColor: TEMAS[c].accent }]}
          >
            {selected ? <IconoCheck size={12} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  circulosColor: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP_CIRCULOS_COLOR,
  },
  circuloColor: {
    width: TAM_CIRCULO_COLOR,
    height: TAM_CIRCULO_COLOR,
    borderRadius: TAM_CIRCULO_COLOR / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
