import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import {
  formatNotificationTime,
  notificationMessage,
} from "../notificationRules";
import type { AppNotification } from "../types";
import { NotificationLeading } from "./NotificationLeading";

/** Tarjeta de una notificación en la lista; las no leídas llevan un punto a la derecha. */
export function NotificationItem({
  notification,
  now,
  isDark,
  onPress,
}: {
  notification: AppNotification;
  /** Momento contra el que se calcula la antigüedad */
  now: number;
  isDark: boolean;
  onPress: (notification: AppNotification) => void;
}) {
  const message = notificationMessage(notification);
  const time = formatNotificationTime(notification.createdAt, now);

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`${notification.actorName} ${message}, ${time}${notification.read ? "" : ", sin leer"}`}
      onPress={() => onPress(notification)}
      style={[
        styles.tarjeta,
        { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" },
      ]}
    >
      <NotificationLeading notification={notification} size={46} />

      <View style={styles.textos}>
        <Text
          numberOfLines={2}
          style={[styles.mensaje, { color: isDark ? "#CBD5E1" : "#4B5563" }]}
        >
          <Text
            style={[styles.nombre, { color: isDark ? "#F1F5F9" : "#101010" }]}
          >
            {notification.actorName}
          </Text>{" "}
          {message}
        </Text>
        <Text style={[styles.tiempo, { color: isDark ? "#94A3B8" : "#8A8A8A" }]}>
          {time}
        </Text>
      </View>

      {notification.read ? null : <View style={styles.punto} />}
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 19,
    marginBottom: 8,
  },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  nombre: { fontSize: 13.5, fontWeight: "600" },
  mensaje: { fontSize: 13, lineHeight: 19 },
  tiempo: { fontSize: 11.5 },
  punto: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF3366" },
});
