import { StyleSheet, View } from "react-native";

import { BotonBarra } from "@/components/ui/BotonBarra";
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
 * Botón de la campana del encabezado del inicio, con el mismo estilo de los botones de los
 * demás módulos (`BotonBarra`): abre las notificaciones y muestra cuántas hay sin leer.
 */
export function NotificationBellButton() {
  const { isDark } = useAppTheme();
  const { openNotifications } = useAppNavigation();
  const { unreadCount } = useNotifications();

  return (
    <View>
      <BotonBarra
        etiqueta={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        onPress={openNotifications}
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
      </BotonBarra>
      {/* Fuera del cristal, que recorta lo que sale de él */}
      {unreadCount > 0 ? (
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>
            {unreadBadgeLabel(unreadCount)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
