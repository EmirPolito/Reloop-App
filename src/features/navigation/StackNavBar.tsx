import { usePathname } from "expo-router";

import { Navegacion } from "@/components/navbar/Navegacion";
import { useChats } from "@/features/chats/ChatProvider";
import { useNotifications } from "@/features/notificaciones/NotificationsProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useAppNavigation } from "./useAppNavigation";

const RUTA_NOTIFICACIONES = "/notificaciones";

/**
 * La misma barra de las pestañas, para pantallas de la pila (perfil público,
 * notificaciones). Ninguna pestaña queda marcada: tocar una vuelve a esa pestaña.
 */
export function StackNavBar() {
  const { isDark } = useAppTheme();
  const { chats } = useChats();
  const { unreadCount } = useNotifications();
  const { navigate, openNotifications } = useAppNavigation();
  const enNotificaciones = usePathname() === RUTA_NOTIFICACIONES;

  return (
    <Navegacion
      activeTab={null}
      onNavigate={navigate}
      // Ya en notificaciones, la campana no apila otra pantalla igual
      onOpenNotifications={enNotificaciones ? noop : openNotifications}
      notificacionesActivas={enNotificaciones}
      isDark={isDark}
      hasUnreadChats={chats.some((chat) => chat.unread)}
      unreadNotifications={unreadCount}
    />
  );
}

function noop() {}
