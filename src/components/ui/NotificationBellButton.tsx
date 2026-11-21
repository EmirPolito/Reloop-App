import { Pressable, StyleSheet, View } from "react-native";

import { PildoraCristal } from "@/features/busqueda/components/PildoraCristal";

import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { unreadBadgeLabel } from "@/features/notificaciones/notificationRules";
import { useNotifications } from "@/features/notificaciones/NotificationsProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import {
  IconoNotificacion,
  IconoNotificacionRellena,
} from "./IconoNotificacion";

/**
 * Botón circular de cristal (el estilo del buscador) con la campana del encabezado del
 * inicio: abre las notificaciones y muestra cuántas hay sin leer.
 */
export function NotificationBellButton({ lado = 45 }: { lado?: number }) {
  const { isDark } = useAppTheme();
  const { openNotifications } = useAppNavigation();
  const { unreadCount } = useNotifications();

  return (
    <Pressable
      onPress={openNotifications}
      style={({ pressed }) => [
        { width: lado, height: lado },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : "Notificaciones"
      }
    >
      <PildoraCristal
        contentStyle={[
          styles.boton,
          { width: lado, height: lado, minHeight: lado },
        ]}
      >
        {/* De contorno; rellena cuando hay notificaciones sin leer */}
        {unreadCount > 0 ? (
          <IconoNotificacionRellena
            size={24}
            color={isDark ? "#FFFFFF" : "#23242C"}
          />
        ) : (
          <IconoNotificacion size={24} color={isDark ? "#FFFFFF" : "#23242C"} />
        )}
      </PildoraCristal>
      {/* Fuera del cristal, que recorta lo que sale de él */}
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
    paddingHorizontal: 0,
    paddingVertical: 0,
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
