import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

/**
 * Capa que, en el modo de selección de Favoritos, cubre una tarjeta: tocarla la marca o la
 * desmarca (con un círculo arriba a la izquierda).
 */
export function CapaSeleccion({
  etiqueta,
  marcada,
  onPress,
}: {
  etiqueta: string;
  marcada: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: marcada }}
      onPress={onPress}
      style={StyleSheet.absoluteFill}
    >
      <View
        style={[
          styles.check,
          marcada
            ? { backgroundColor: "#1C77FF", borderColor: "#1C77FF" }
            : { borderColor: "#FFFFFF", backgroundColor: "#00000040" },
        ]}
      >
        {marcada ? (
          <Ionicons name="checkmark" size={17} color="#FFFFFF" />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
