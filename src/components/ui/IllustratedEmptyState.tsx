import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Estado vacío sin tarjeta: ilustración grande centrada, título y leyenda.
 * `style` define el espacio vertical según la pantalla.
 */
export function IllustratedEmptyState({
  icon,
  title,
  message,
  style,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useAppTheme();
  return (
    <View style={[styles.container, style]}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.title, { color: isDark ? "#ffffff" : "#101010" }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: isDark ? "#9ca3af" : "#696969" }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  icon: { marginBottom: 15 },
  title: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  message: {
    fontSize: 12.5,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 21,
  },
});
