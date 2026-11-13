import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { DORADO_PREMIUM, PremiumBadge } from "@/components/ui/PremiumBadge";
import { IconoFlecha } from "@/features/perfil/Perfiliconos";
import { Text } from "@/features/shared/Text";

/**
 * Acceso a ReLoop Premium desde el perfil propio: sin membresía invita a conocer los
 * beneficios; con ella indica que está activa. Compacta, para no competir con el perfil.
 */
export function TarjetaPremium({
  activa,
  isDark,
  onPress,
}: {
  activa: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const titulo = activa ? "Premium activo" : "ReLoop Premium";
  const detalle = activa
    ? "Ver los beneficios de tu membresía"
    : "Insignia, prioridad en el feed y anuncios destacados";

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${detalle}`}
      onPress={onPress}
      style={[
        styles.tarjeta,
        {
          backgroundColor: isDark ? "#1A1712" : "#FFFFFF",
          borderColor: isDark ? "#3A3020" : "#F3E3BC",
        },
      ]}
    >
      <View
        style={[
          styles.icono,
          { backgroundColor: isDark ? "#2A2214" : "#FFF6E0" },
        ]}
      >
        <PremiumBadge size={26} variant={activa ? "shimmer" : "static"} />
      </View>
      <View style={styles.textos}>
        <Text
          style={[styles.titulo, { color: isDark ? "#F1F5F9" : "#101010" }]}
        >
          {titulo}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.detalle, { color: isDark ? "#A8A29E" : "#8a8a8a" }]}
        >
          {detalle}
        </Text>
      </View>
      <IconoFlecha size={20} color={DORADO_PREMIUM} />
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: "0 2px 10px rgba(226, 164, 28, 0.08)",
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  titulo: { fontFamily: "Inter_600SemiBold", fontSize: 14.5 },
  detalle: { fontFamily: "Inter_400Regular", fontSize: 12.5, lineHeight: 17 },
});
