import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Disolvible, type Disolvedor } from "@/components/ui/Disolvible";
import { TextoSobreRojo } from "@/components/ui/SwipeParaEliminar";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import {
  formatNotificationTime,
  notificationMessage,
  notificationTitle,
} from "../notificationRules";
import type { AppNotification } from "../types";
import { NotificationLeading } from "./NotificationLeading";

/** Hasta dónde llega la sombra de la tarjeta (radio 10 + desplazamiento 3) */
const SOMBRA = 14;
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
  onLongPress,
  seleccionando = false,
  marcada = false,
  registrar,
}: {
  notification: AppNotification;
  /** Momento contra el que se calcula la antigüedad */
  now: number;
  onPress: (notification: AppNotification) => void;
  /** Toque largo: empieza a seleccionar para eliminar */
  onLongPress?: (notification: AppNotification) => void;
  /** Modo de selección: el toque marca o desmarca la notificación */
  seleccionando?: boolean;
  marcada?: boolean;
  /** La pantalla guarda cómo disolver esta tarjeta (y la quita al desmontarse) */
  registrar?: (id: string, disolvedor: Disolvedor | null) => void;
}) {
  const { isDark } = useAppTheme();
  const message = notificationMessage(notification);
  const time = formatNotificationTime(notification.createdAt, now);

  return (
    // El margen va en el envoltorio y la sombra dentro de su captura (ver Disolvible)
    <Disolvible
      id={notification.id}
      registrar={registrar}
      sombra={SOMBRA}
      margenInferior={0}
    >
      <PressableSuave
        accessibilityRole="button"
        accessibilityLabel={`${notificationTitle(notification)}. ${notification.actorName} ${message}, ${time}${notification.read ? "" : ", sin leer"}`}
        accessibilityState={seleccionando ? { selected: marcada } : undefined}
        onPress={() => onPress(notification)}
        onLongPress={onLongPress ? () => onLongPress(notification) : undefined}
        style={[
          styles.tarjeta,
          // Blanco liso en claro; en oscuro, el mismo tono translúcido del buscador
          { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF" },
        ]}
      >
        {seleccionando ? (
          <View
            style={[
              styles.check,
              marcada
                ? { backgroundColor: COLOR_PUNTO, borderColor: COLOR_PUNTO }
                : { borderColor: isDark ? "#64748B" : "#C4C4CA" },
            ]}
          >
            {marcada ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : null}
          </View>
        ) : null}
        <NotificationLeading notification={notification} size={LADO_LEADING} />

        <View style={styles.textos}>
          <Text
            numberOfLines={1}
            style={[styles.titulo, { color: isDark ? "#F1F5F9" : "#101010" }]}
          >
            {notificationTitle(notification)}
          </Text>
          {/* En oscuro la tarjeta es translúcida: al deslizar, el gris se aclara sobre el rojo */}
          <TextoSobreRojo
            numberOfLines={2}
            colorBase={isDark ? "#94A3B8" : "#6B6B70"}
            colorSobreRojo={isDark ? undefined : "#6B6B70"}
            style={styles.descripcion}
          >
            {notification.actorName} {message}
          </TextoSobreRojo>
        </View>

        <View style={styles.derecha}>
          <TextoSobreRojo
            colorBase={isDark ? "#94A3B8" : "#8A8A8F"}
            colorSobreRojo={isDark ? undefined : "#8A8A8F"}
            style={styles.tiempo}
          >
            {time}
          </TextoSobreRojo>
          <View
            style={[
              styles.punto,
              notification.read && {
                backgroundColor: isDark ? "#ffffff26" : COLOR_PUNTO_LEIDO,
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </View>
      </PressableSuave>
    </Disolvible>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 22,
    // El fondo de abajo es casi blanco: un borde fino y una sombra suave separan cada tarjeta
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.01)",
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
