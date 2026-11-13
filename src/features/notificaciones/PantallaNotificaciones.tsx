import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ENTRADA_MODULO } from "@/constants/motion";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { StackNavBar } from "@/features/navigation/StackNavBar";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { IconoMensaje } from "@/features/perfil/Perfiliconos";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import { NotificationItem } from "./components/NotificationItem";
import { useOpenNotification } from "./hooks/useOpenNotification";
import { groupNotifications } from "./notificationRules";
import {
  useNotificationActions,
  useNotifications,
} from "./NotificationsProvider";

type Filtro = "todas" | "sinLeer";

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

/** Todas las notificaciones recibidas, por antigüedad, con filtro de no leídas. */
export function PantallaNotificaciones() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const { notifications, unreadCount, status } = useNotifications();
  const { markAllRead } = useNotificationActions();
  const openNotification = useOpenNotification();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  // Un solo "ahora" para toda la lista: las antigüedades no bailan entre renders
  const [now] = useState(() => Date.now());

  const visibles =
    filtro === "sinLeer"
      ? notifications.filter((item) => !item.read)
      : notifications;
  const sections = groupNotifications(visibles, now);

  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#8A8A8A";
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: isDark ? "#ffffff33" : "#ffffff",
  };

  const marcarTodas = () => {
    markAllRead().catch((error) =>
      showErrorAlert("No se pudieron marcar como leídas", error),
    );
  };

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={styles.barra}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={26} color={texto} />
          </View>
        </PressableScale>

        <Text style={[styles.titulo, { color: texto }]}>Notificaciones</Text>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Marcar todas como leídas"
          accessibilityState={{ disabled: unreadCount === 0 }}
          disabled={unreadCount === 0}
          onPress={marcarTodas}
          scaleTo={0.92}
          style={[
            styles.botonBarra,
            boton,
            unreadCount === 0 && { opacity: 0.45 },
          ]}
        >
          <Ionicons name="checkmark-done" size={21} color={texto} />
        </PressableScale>
      </View>

      <View accessibilityRole="tablist" style={styles.filtros}>
        <ChipFiltro
          texto="Todas"
          activo={filtro === "todas"}
          isDark={isDark}
          onPress={() => setFiltro("todas")}
        />
        <ChipFiltro
          texto={unreadCount > 0 ? `Sin leer · ${unreadCount}` : "Sin leer"}
          activo={filtro === "sinLeer"}
          isDark={isDark}
          onPress={() => setFiltro("sinLeer")}
        />
      </View>

      {status === "loading" ? (
        <LoadingState />
      ) : (
        <Animated.View entering={ENTRADA} style={styles.lista}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 15,
              // Espacio para que la barra de navegación no tape la última tarjeta
              paddingBottom: insets.bottom + 110,
            }}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.seccion, { color: suave }]}>
                {section.title}
              </Text>
            )}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                now={now}
                isDark={isDark}
                onPress={openNotification}
              />
            )}
            ListEmptyComponent={
              <IllustratedEmptyState
                icon={<IconoMensaje size={80} color={isDark ? "#334155" : "#D9D9DE"} />}
                title={
                  status === "error"
                    ? "No pudimos cargar tus notificaciones"
                    : filtro === "sinLeer"
                      ? "Estás al día"
                      : "Aún no tienes notificaciones"
                }
                message={
                  status === "error"
                    ? "Revisa tu conexión e inténtalo de nuevo."
                    : filtro === "sinLeer"
                      ? "No te queda ninguna notificación por leer."
                      : "Cuando alguien te siga, te escriba o reaccione a tus publicaciones, lo verás aquí."
                }
                style={styles.vacio}
              />
            }
          />
        </Animated.View>
      )}
      <StackNavBar />
    </View>
  );
}

function ChipFiltro({
  texto,
  activo,
  isDark,
  onPress,
}: {
  texto: string;
  activo: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const fondoActivo = isDark ? "#F1F5F9" : "#101010";
  const fondo = isDark ? "#1E293B" : "#FFFFFF";
  const colorActivo = isDark ? "#101010" : "#FFFFFF";
  const color = isDark ? "#CBD5E1" : "#4B5563";
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      scaleTo={0.96}
      style={[styles.chip, { backgroundColor: activo ? fondoActivo : fondo }]}
    >
      <Text style={[styles.chipTexto, { color: activo ? colorActivo : color }]}>
        {texto}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  botonBarra: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 16, fontWeight: "700" },
  filtros: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 6,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipTexto: { fontSize: 13, fontWeight: "500" },
  lista: { flex: 1 },
  seccion: {
    fontSize: 12.5,
    fontWeight: "500",
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  vacio: { paddingVertical: 150 },
});
