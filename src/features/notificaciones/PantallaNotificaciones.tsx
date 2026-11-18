import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IconoNotificacionRellena } from "@/components/ui/IconoNotificacion";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ENTRADA_MODULO } from "@/constants/motion";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { FondoHome } from "@/features/home/components/FondoHome";
import { CATEGORIES } from "@/features/marketplace/data";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import { NotificationItem } from "./components/NotificationItem";
import { useOpenNotification } from "./hooks/useOpenNotification";
import {
  groupNotifications,
  notificationMessage,
  notificationTitle,
} from "./notificationRules";
import {
  useNotificationActions,
  useNotifications,
} from "./NotificationsProvider";

/** Todas, las no leídas o las de publicaciones de una categoría */
type Filtro = "todas" | "sinLeer" | CategoryId;

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);

/** Botones redondos del encabezado y sus iconos */
const LADO_BOTON = 48;
const ICONO_ATRAS = 28;
const ICONO_LEIDAS = 24;

/** Todas las notificaciones recibidas, por antigüedad, con buscador y filtros. */
export function PantallaNotificaciones() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const { notifications, unreadCount, status } = useNotifications();
  const { markAllRead } = useNotificationActions();
  const { products } = useMarketplaceState();
  const openNotification = useOpenNotification();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");
  // Un solo "ahora" para toda la lista: las antigüedades no bailan entre renders
  const [now] = useState(() => Date.now());

  // Categoría de cada publicación, para filtrar las notificaciones que hablan de ellas
  const categoriaDe = new Map(products.map((p) => [p.id, p.category]));
  // Con "@" al inicio se buscan personas: sus notificaciones, por su usuario o su nombre
  const modoBusqueda = modoDeBusqueda(busqueda);
  const buscaPersonas = modoBusqueda.modo === "usuarios";
  const termino = buscaPersonas
    ? modoBusqueda.termino
    : busqueda.trim().toLocaleLowerCase();
  const actores = useMemo(
    () => [...new Set(notifications.map((item) => item.actorId))],
    [notifications],
  );
  const perfiles = usePerfilDe.varias(actores);

  const visibles = notifications.filter((item) => {
    if (filtro === "sinLeer" && item.read) return false;
    if (
      filtro !== "todas" &&
      filtro !== "sinLeer" &&
      (!item.productId || categoriaDe.get(item.productId) !== filtro)
    ) {
      return false;
    }
    if (!termino) return true;
    if (buscaPersonas) {
      const usuario = perfiles.get(item.actorId)?.username ?? "";
      return (
        usuario.includes(termino) ||
        normalizarNombre(item.actorName).includes(termino)
      );
    }
    return `${notificationTitle(item)} ${item.actorName} ${notificationMessage(item)}`
      .toLocaleLowerCase()
      .includes(termino);
  });
  const sections = groupNotifications(visibles, now);

  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#8A8A8F";
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: isDark ? "#ffffff33" : "#ffffff",
  };

  const marcarTodas = () => {
    markAllRead().catch((error) =>
      showErrorAlert("No se pudieron marcar como leídas", error),
    );
  };

  const categoria = CATEGORIES.find((c) => c.id === filtro);
  const opciones: { id: Filtro; texto: string }[] = [
    { id: "todas", texto: "Todas" },
    {
      id: "sinLeer",
      texto: unreadCount > 0 ? `Sin leer · ${unreadCount}` : "Sin leer",
    },
    ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
  ];

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 8 }]}>
      {/* El mismo fondo del inicio, con los colores de arriba un poco menos marcados */}
      <FondoHome intensidad={0.7} dentroDeEscena={false} />

      {/* Volver a la izquierda, el título al centro y marcar como leídas a la derecha */}
      <View style={styles.barra}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={ICONO_ATRAS} color={texto} />
          </View>
        </PressableScale>

        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          Notificaciones
        </Text>

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
          <Ionicons name="checkmark-done" size={ICONO_LEIDAS} color={texto} />
        </PressableScale>
      </View>

      {/* Buscador blanco, como el del inicio */}
      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar notificaciones o @usuario"
        accessibilityLabel="Buscar notificaciones"
        personas={buscaPersonas}
      />

      <FiltrosPildoras
        opciones={opciones}
        activo={filtro}
        onCambiar={setFiltro}
      />

      {status === "loading" ? (
        <LoadingState />
      ) : (
        <Animated.View entering={ENTRADA} style={styles.lista}>
          <Animated.View
            key={filtro}
            entering={CAMBIO_FILTRO}
            style={styles.lista}
          >
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
                  onPress={openNotification}
                />
              )}
              ListEmptyComponent={
                <IllustratedEmptyState
                  icon={
                    <IconoNotificacionRellena
                      size={80}
                      color={isDark ? "#334155" : "#D9D9DE"}
                    />
                  }
                  title={
                    status === "error"
                      ? "No pudimos cargar tus notificaciones"
                      : termino
                        ? "No encontramos nada"
                        : categoria
                          ? `Nada de ${categoria.label.toLowerCase()}`
                          : filtro === "sinLeer"
                            ? "Estás al día"
                            : "Aún no tienes notificaciones"
                  }
                  message={
                    status === "error"
                      ? "Revisa tu conexión e inténtalo de nuevo."
                      : termino
                        ? "Prueba con otro nombre o palabra."
                        : categoria
                          ? "Aquí verás lo que pase con tus publicaciones de ese tipo."
                          : filtro === "sinLeer"
                            ? "No te queda ninguna notificación por leer."
                            : "Cuando alguien te siga, te escriba o reaccione a tus publicaciones, lo verás aquí."
                  }
                  style={styles.vacio}
                />
              }
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  botonBarra: {
    width: LADO_BOTON,
    height: LADO_BOTON,
    borderRadius: LADO_BOTON / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Centrado en la barra, sin importar el ancho de los botones
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
  lista: { flex: 1 },
  seccion: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 138, paddingBottom: 162 },
});
