import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";

export type Pestana = "publicaciones" | "anuncios";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "publicaciones", label: "Publicaciones" },
  { id: "anuncios", label: "Anuncios" },
];

/**
 * Selector de Publicaciones / Anuncios: solo texto, uno al lado del otro y alineados a la
 * izquierda, como el título de una sección. La pestaña activa se ve con más color y más peso.
 */
export function FilaPestanas({
  activa,
  onCambiar,
  isDark,
}: {
  activa: Pestana;
  onCambiar: (pestana: Pestana) => void;
  isDark: boolean;
}) {
  const colorActiva = isDark ? "#F1F5F9" : "#101010";
  const colorInactiva = isDark ? "#64748B" : "#A3A3A8";

  return (
    <View accessibilityRole="tablist" style={styles.fila}>
      {PESTANAS.map((p) => {
        const seleccionada = p.id === activa;
        return (
          <PressableSuave
            key={p.id}
            accessibilityRole="tab"
            accessibilityLabel={p.label}
            accessibilityState={{ selected: seleccionada }}
            onPress={() => onCambiar(p.id)}
            hitSlop={8}
          >
            <Text
              style={[
                styles.texto,
                {
                  color: seleccionada ? colorActiva : colorInactiva,
                  fontFamily: seleccionada
                    ? "Inter_700Bold"
                    : "Inter_500Medium",
                },
              ]}
            >
              {p.label}
            </Text>
          </PressableSuave>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  texto: { fontSize: 16 },
});
