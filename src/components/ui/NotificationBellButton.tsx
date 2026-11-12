import { Pressable, StyleSheet, View } from "react-native";

import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { unreadBadgeLabel } from "@/features/notificaciones/notificationRules";
import { useNotifications } from "@/features/notificaciones/NotificationsProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Botón circular con la campana del encabezado de las pestañas: abre las notificaciones y
 * muestra cuántas hay sin leer.
 */
export function NotificationBellButton() {
  const { isDark } = useAppTheme();
  const { openNotifications } = useAppNavigation();
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      onPress={openNotifications}
      style={({ pressed }) => [
        styles.boton,
        {
          backgroundColor: isDark ? "#ffffff1f" : "#ffffff6d",
          borderColor: isDark ? "#ffffff2e" : "#ffffff5b",
        },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : "Notificaciones"
      }
    >
      {/* Mismo icono y color que la campana del Home */}
      <AppIcon
        name="notifications"
        size={19}
        color={isDark ? "#FFFFFF" : "#23242C"}
      />
      {unreadCount > 0 ? (
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>
            {unreadBadgeLabel(unreadCount)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: 45,
    width: 45,
    borderWidth: 2,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  contador: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#FF3366",
    alignItems: "center",
    justifyContent: "center",
  },
  contadorTexto: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
});
