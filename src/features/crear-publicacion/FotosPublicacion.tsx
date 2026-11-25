import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { MAX_FOTOS } from "./draftRules";

/**
 * Las fotos de la publicación: hasta 4 cuadros. La primera es la grande ("Principal"); cada
 * una se quita con su X y los cuadros vacíos abren la galería.
 */
export function FotosPublicacion({
  fotos,
  ocupado,
  onAgregar,
  onQuitar,
}: {
  fotos: readonly string[];
  ocupado: boolean;
  onAgregar: () => void;
  onQuitar: (indice: number) => void;
}) {
  const { isDark } = useAppTheme();
  const fondo = isDark ? "rgba(255,255,255,0.06)" : "#F1F1F3";
  const icono = isDark ? "#A9A5B7" : "#667085";

  return (
    <View style={styles.fila}>
      {Array.from({ length: MAX_FOTOS }, (_, i) => {
        const foto = fotos[i];
        if (foto) {
          return (
            <View
              key={`${foto}-${i}`}
              style={[styles.cuadro, { backgroundColor: fondo }]}
            >
              <Image
                source={{ uri: foto }}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
              {i === 0 ? (
                <View style={styles.principal}>
                  <Text style={styles.principalTexto}>Principal</Text>
                </View>
              ) : null}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Quitar la foto ${i + 1}`}
                onPress={() => onQuitar(i)}
                scaleTo={0.88}
                hitSlop={6}
                style={styles.quitar}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </PressableScale>
            </View>
          );
        }
        // Solo el primer cuadro vacío agrega; los demás esperan su turno
        const siguiente = i === fotos.length;
        return (
          <PressableScale
            key={`vacio-${i}`}
            accessibilityRole="button"
            accessibilityLabel="Agregar una foto"
            accessibilityState={{ disabled: !siguiente || ocupado }}
            disabled={!siguiente || ocupado}
            onPress={onAgregar}
            scaleTo={0.95}
            style={[
              styles.cuadro,
              styles.vacio,
              { backgroundColor: fondo, opacity: siguiente ? 1 : 0.5 },
            ]}
          >
            <Ionicons
              name={siguiente ? "add" : "image-outline"}
              size={24}
              color={icono}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 10 },
  cuadro: { flex: 1, aspectRatio: 1, borderRadius: 16, overflow: "hidden" },
  vacio: { alignItems: "center", justifyContent: "center" },
  principal: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  principalTexto: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  quitar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
