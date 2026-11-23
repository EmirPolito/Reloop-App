import { usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Navegacion } from "@/components/navbar/Navegacion";
import { useChats } from "@/features/chats/ProveedorChats";
import { useNotifications } from "@/features/notificaciones/ProveedorNotificaciones";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { estadoBarraParaRuta, type Tab } from "./rutas";
import { useNavegacion } from "./useNavegacion";

/** Aparece o se oculta al entrar a una pantalla sin barra (conversación, publicación...) */
const TRANSICION = { duration: 110, easing: Easing.out(Easing.cubic) };

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
  const { navigate, openNotifications } = useNavegacion();
  const hayChatsSinLeer = useMemo(
    () => chats.some((chat) => chat.unread),
    [chats],
  );
  const { visible, activeTab, notificaciones } =
    estadoBarraParaRuta(usePathname());

  const opacidad = useSharedValue(visible ? 1 : 0);
  // En web `pointerEvents="none"` no apaga a los hijos con "box-none" (la barra seguía
  // recibiendo toques invisible: tocar el campo del chat abría Favoritos). Ahí, al terminar
  // de desvanecerse, se quita del todo
  const [quitada, setQuitada] = useState(!visible);
  useEffect(() => {
    if (visible) setQuitada(false);
    opacidad.set(
      withTiming(visible ? 1 : 0, TRANSICION, (terminada) => {
        if (terminada && !visible) scheduleOnRN(setQuitada, true);
      }),
    );
  }, [visible, opacidad]);
  const estilo = useAnimatedStyle(() => ({ opacity: opacidad.get() }));

  // Dos toques seguidos al mismo destino no deben abrir dos veces la misma pantalla; los que
  // van a destinos distintos sí pasan (si no, tocar rápido otra pestaña "no hacía nada")
  const ultimoToque = useRef({ clave: "", hora: 0 });
  const conBloqueo = useCallback((clave: string, accion: () => void) => {
    const ahora = Date.now();
    const anterior = ultimoToque.current;
    if (anterior.clave === clave && ahora - anterior.hora < BLOQUEO_MS) return;
    ultimoToque.current = { clave, hora: ahora };
    accion();
  }, []);

  // Desde la barra se navega al instante (sin esperar la salida animada del módulo, que solo
  // se usa con su botón de volver): el toque responde y la pantalla nueva entra con su efecto
  const alIrAPestana = useCallback(
    (tab: Tab) => conBloqueo(tab, () => navigate(tab)),
    [conBloqueo, navigate],
  );
  const alAbrirNotificaciones = useCallback(
    () => conBloqueo("notificaciones", openNotifications),
    [conBloqueo, openNotifications],
  );

  return (
    // Cubre la pantalla sin quitarle toques al contenido: solo la barra los recibe
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[
        StyleSheet.absoluteFill,
        estilo,
        Platform.OS === "web" && quitada && styles.quitada,
      ]}
    >
      <Navegacion
        activeTab={activeTab}
        onNavigate={alIrAPestana}
        // Ya en notificaciones, la campana no apila otra pantalla igual
        onOpenNotifications={notificaciones ? noop : alAbrirNotificaciones}
        notificacionesActivas={notificaciones}
        isDark={isDark}
        hasUnreadChats={hayChatsSinLeer}
        unreadNotifications={unreadCount}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  quitada: { display: "none" },
});
