import { usePathname } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Navegacion } from "@/components/navbar/Navegacion";
import { useChats } from "@/features/chats/ChatProvider";
import { useNotifications } from "@/features/notificaciones/NotificationsProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { estadoBarraParaRuta, type Tab } from "./routes";
import { useAppNavigation } from "./useAppNavigation";

/** Aparece o se oculta al entrar a una pantalla sin barra (conversación, publicación...) */
const TRANSICION = { duration: 160, easing: Easing.out(Easing.cubic) };

/** Mientras dura la transición entre pantallas, otro toque a la barra no hace nada */
const BLOQUEO_MS = 450;

function noop() {}

/**
 * La barra de navegación de toda la app. Vive fuera de la pila de pantallas y lee la ruta
 * actual, así hay una sola: no se duplica en notificaciones o en el perfil de otra persona,
 * y su indicador se desliza de forma continua (pestaña → campana → pestaña) en lugar de
 * animarse por separado en dos barras superpuestas.
 */
export function BarraNavegacion() {
  const { isDark } = useAppTheme();
  const { chats } = useChats();
  const { unreadCount } = useNotifications();
  const { navigate, openNotifications } = useAppNavigation();
  const { visible, activeTab, notificaciones } =
    estadoBarraParaRuta(usePathname());

  const opacidad = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacidad.set(withTiming(visible ? 1 : 0, TRANSICION));
  }, [visible, opacidad]);
  const estilo = useAnimatedStyle(() => ({ opacity: opacidad.get() }));

  // Dos toques seguidos no deben abrir dos veces la misma pantalla
  const ultimoToque = useRef(0);
  const conBloqueo = useCallback((accion: () => void) => {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < BLOQUEO_MS) return;
    ultimoToque.current = ahora;
    accion();
  }, []);

  const alIrAPestana = useCallback(
    (tab: Tab) => conBloqueo(() => navigate(tab)),
    [conBloqueo, navigate],
  );
  const alAbrirNotificaciones = useCallback(
    () => conBloqueo(openNotifications),
    [conBloqueo, openNotifications],
  );

  return (
    // Cubre la pantalla sin quitarle toques al contenido: solo la barra los recibe
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[StyleSheet.absoluteFill, estilo]}
    >
      <Navegacion
        activeTab={activeTab}
        onNavigate={alIrAPestana}
        // Ya en notificaciones, la campana no apila otra pantalla igual
        onOpenNotifications={notificaciones ? noop : alAbrirNotificaciones}
        notificacionesActivas={notificaciones}
        isDark={isDark}
        hasUnreadChats={chats.some((chat) => chat.unread)}
        unreadNotifications={unreadCount}
      />
    </Animated.View>
  );
}
