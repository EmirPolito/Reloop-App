import { StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Buscador blanco en forma de píldora (el de notificaciones y favoritos, igual al del
 * inicio). Con `personas` muestra la etiqueta "@ Personas": el texto empieza con "@" y se
 * busca por usuario.
 */
export function BuscadorBlanco({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  personas = false,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  personas?: boolean;
}) {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";

  return (
    <View
      style={[
        styles.buscador,
        { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF" },
      ]}
    >
      <IconoBusqueda size={22} color={isDark ? "#E3DEED" : "#4A4D57"} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.entrada, { color: texto }]}
      />
      {personas ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          accessible
          accessibilityLabel="Buscando personas"
          style={styles.etiquetaPersonas}
        >
          <Text style={styles.etiquetaPersonasTexto}>@ Personas</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 54,
    marginHorizontal: 15,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  entrada: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  etiquetaPersonas: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#E8F1FF",
  },
  etiquetaPersonasTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11.5,
    color: "#1C77FF",
  },
});
