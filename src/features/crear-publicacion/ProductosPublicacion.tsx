import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import {
  LARGO_DESCRIPCION_OPCION,
  MAX_OPCIONES,
  type DraftOption,
} from "./draftRules";

/**
 * Venta y comida: los productos que se pueden pedir (p. ej., cada sabor de refresco). Cada
 * producto lleva su imagen a la izquierda (tocarla elige la foto), el nombre con una X para
 * quitarlo, una descripción corta y el precio.
 */
export function ProductosPublicacion({
  opciones,
  ocupado,
  onCambiar,
  onElegirFoto,
  onQuitar,
  onAgregar,
}: {
  opciones: readonly DraftOption[];
  ocupado: boolean;
  onCambiar: (key: string, cambio: Partial<DraftOption>) => void;
  onElegirFoto: (key: string) => void;
  onQuitar: (key: string) => void;
  onAgregar: () => void;
}) {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#A9A5B7" : "#828690";
  const fondo = isDark ? "rgba(255,255,255,0.06)" : "#F1F1F3";

  return (
    <View style={styles.lista}>
      {opciones.map((opcion, i) => (
        <View key={opcion.key} style={[styles.tarjeta]}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={
              opcion.photo
                ? `Cambiar la foto del producto ${i + 1}`
                : `Elegir la foto del producto ${i + 1}`
            }
            disabled={ocupado}
            onPress={() => onElegirFoto(opcion.key)}
            scaleTo={0.94}
            style={[styles.foto, { backgroundColor: fondo }]}
          >
            {opcion.photo ? (
              <Image
                source={{ uri: opcion.photo }}
                contentFit="cover"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <Ionicons name="camera-outline" size={22} color={suave} />
            )}
          </PressableScale>
          <View style={styles.campos}>
            <View style={styles.filaNombre}>
              <TextInput
                accessibilityLabel={`Nombre del producto ${i + 1}`}
                value={opcion.name}
                onChangeText={(name) => onCambiar(opcion.key, { name })}
                placeholder="Ej. Refresco de cola"
                placeholderTextColor={suave}
                maxLength={40}
                style={[styles.nombre, { color: texto }]}
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Quitar el producto ${i + 1}`}
                onPress={() => onQuitar(opcion.key)}
                scaleTo={0.88}
                hitSlop={8}
              >
                <Ionicons name="close-circle-outline" size={20} color={suave} />
              </PressableScale>
            </View>
            <TextInput
              accessibilityLabel={`Descripción corta del producto ${i + 1}`}
              value={opcion.description}
              onChangeText={(description) =>
                onCambiar(opcion.key, { description })
              }
              placeholder="Descripción corta (opcional)"
              placeholderTextColor={suave}
              maxLength={LARGO_DESCRIPCION_OPCION}
              style={[styles.descripcion, { color: texto }]}
            />
            <TextInput
              accessibilityLabel={`Precio del producto ${i + 1}`}
              value={opcion.priceText}
              onChangeText={(priceText) => onCambiar(opcion.key, { priceText })}
              placeholder="$ 0.00"
              placeholderTextColor={suave}
              keyboardType="decimal-pad"
              style={[styles.precio, { color: texto, backgroundColor: fondo }]}
            />
          </View>
        </View>
      ))}

      {opciones.length < MAX_OPCIONES ? (
        <PressableScale
          accessibilityRole="button"
          onPress={onAgregar}
          scaleTo={0.97}
          style={[styles.agregar, { backgroundColor: fondo }]}
        >
          <Ionicons name="add" size={18} color={texto} />
          <Text style={[styles.agregarTexto, { color: texto }]}>
            Agregar producto
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 10 },
  tarjeta: {
    flexDirection: "row",
    gap: 12,
    padding: 8,
  },
  foto: {
    width: 84,
    height: 84,
    borderRadius: 13,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  campos: { flex: 1, gap: 8, justifyContent: "center" },
  filaNombre: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombre: { flex: 1, fontSize: 14.5, paddingVertical: 2 },
  descripcion: { fontSize: 12.5, paddingVertical: 0, marginTop: -4 },
  precio: {
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  agregar: {
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  agregarTexto: { fontSize: 14, fontWeight: "500" },
});
