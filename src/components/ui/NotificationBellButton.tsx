import { Pressable } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { showNoNotificationsAlert } from "@/utils/alerts";

/** Botón circular con la campana de notificaciones del encabezado de las pestañas. */
export function NotificationBellButton({
  onPress = showNoNotificationsAlert,
}: {
  onPress?: () => void;
}) {
  const { isDark } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: 45,
          width: 45,
          backgroundColor: isDark ? "#ffffff1f" : "#ffffff6d",
          borderWidth: 2,
          borderColor: isDark ? "#ffffff2e" : "#ffffff5b",
          borderRadius: 30,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Notificaciones"
    >
      {/* Mismo icono y color que la campana del Home */}
      <AppIcon
        name="notifications"
        size={19}
        color={isDark ? "#FFFFFF" : "#23242C"}
      />
    </Pressable>
  );
}
