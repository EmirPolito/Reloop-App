import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import {
  formatNotificationTime,
  notificationMessage,
  notificationTitle,
} from "../notificationRules";
import type { AppNotification } from "../types";
import { NotificationLeading } from "./NotificationLeading";

const COLOR_PUNTO = "#1C77FF";
/** Punto de una notificación ya leída: un gris casi blanco (neutral-100) */
const COLOR_PUNTO_LEIDO = "#ECECEE";
/** Círculo (avatar o icono) de la izquierda */
const LADO_LEADING = 50;

/**
 * Tarjeta de una notificación en la lista. A la izquierda el avatar o el icono; en medio el
 * título arriba y la descripción debajo; a la derecha la hora y, debajo de ella, un punto
 * azul: fuerte mientras no se ha leído y opaco cuando ya se leyó.
 */
export function NotificationItem({
  notification,
  now,
  onPress,
}: {
  notification: AppNotification;
  /** Momento contra el que se calcula la antigüedad */
  now: number;
  onPress: (notification: AppNotification) => void;
}) {
  const message = notificationMessage(notification);
  const time = formatNotificationTime(notification.createdAt, now);

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`${notificationTitle(notification)}. ${notification.actorName} ${message}, ${time}${notification.read ? "" : ", sin leer"}`}
      onPress={() => onPress(notification)}
      style={[
        styles.tarjeta,
        // Blanco liso, sin transparencia, también en oscuro
        { backgroundColor: "#FFFFFF" },
      ]}
    >
      <NotificationLeading notification={notification} size={LADO_LEADING} />

      <View style={styles.textos}>
        <Text numberOfLines={1} style={[styles.titulo, { color: "#101010" }]}>
          {notificationTitle(notification)}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.descripcion, { color: "#6B6B70" }]}
        >
          {notification.actorName} {message}
        </Text>
      </View>

      <View style={styles.derecha}>
        <Text style={[styles.tiempo, { color: "#8A8A8F" }]}>{time}</Text>
        <View
          style={[
            styles.punto,
            notification.read && { backgroundColor: COLOR_PUNTO_LEIDO },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 22,
    marginBottom: 9,
    // El fondo de abajo es casi blanco: un borde fino y una sombra suave separan cada tarjeta
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.01)",
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  textos: { flex: 1, minWidth: 0, gap: 3 },
  titulo: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  descripcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  // Un poco más abajo y hacia la izquierda que el borde de la tarjeta
  derecha: {
    alignItems: "flex-end",
    gap: 9,
    alignSelf: "stretch",
    paddingTop: 10,
    marginRight: 4,
  },
  tiempo: { fontFamily: "Inter_500Medium", fontSize: 11.5 },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLOR_PUNTO,
  },
});
