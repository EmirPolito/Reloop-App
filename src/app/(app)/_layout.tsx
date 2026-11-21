import { Stack } from "expo-router";

import { useAuth } from "@/features/auth/AuthProvider";
import { AvisoHost } from "@/features/avisos/AvisosProvider";
import { STACK_SCREEN_OPTIONS } from "@/features/navigation/stackOptions";
import { NotificationBannerHost } from "@/features/notificaciones/components/NotificationBannerHost";
import { BarraNavegacion } from "@/features/navigation/BarraNavegacion";
import { SheetBienvenida } from "@/features/onboarding/SheetBienvenida";
import { SessionProviders } from "@/features/session/SessionProviders";

export const unstable_settings = { initialRouteName: "(tabs)" };

export default function AppLayout() {
  const { user } = useAuth();
  // Al cerrar sesión este layout se renderiza una vez más antes de desmontarse
  if (!user) return null;

  return (
    <SessionProviders key={user.uid} user={user}>
      <Stack screenOptions={STACK_SCREEN_OPTIONS}>
        <Stack.Screen name="(tabs)" />
        {/* Sin la animación de la pila: entra y sale con la de los módulos (TabScene) */}
        <Stack.Screen name="product/[id]" options={{ animation: "none" }} />
        <Stack.Screen name="chat/[id]" />
        {/* Sin la animación de la pila: entran y salen con la de los módulos (TabScene) */}
        <Stack.Screen name="user/[id]" options={{ animation: "none" }} />
        <Stack.Screen name="editar-perfil" options={{ animation: "none" }} />
        {/* Sin la animación de la pila: entra y sale con la de los módulos (TabScene) */}
        <Stack.Screen name="notificaciones" options={{ animation: "none" }} />
        <Stack.Screen name="legal/[documento]" />
        <Stack.Screen name="premium" />
        {/* Encima del inicio, que se sigue viendo detrás: la transición la anima el módulo.
            "contained": dentro de la pila y no como modal nativo encima de toda la app. Así el
            efecto de disolver (que se dibuja sobre la pila) se ve: con "transparentModal" el
            polvo quedaba detrás del módulo y solo se veía el hueco en blanco */}
        <Stack.Screen
          name="buscar"
          options={{
            presentation: "containedTransparentModal",
            animation: "none",
          }}
        />
      </Stack>
      {/* La barra de navegación: una sola, fuera de la pila, así no se duplica ni se anima por
          separado al ir y volver de notificaciones o de un perfil */}
      <BarraNavegacion />
      {/* Después de la pila: el banner flota encima de cualquier pantalla */}
      <NotificationBannerHost />
      {/* Avisos de la app (republicada, eliminada...), con el mismo diseño */}
      <AvisoHost />
      {/* Configuración inicial de las cuentas nuevas (no se puede cerrar hasta terminar) */}
      <SheetBienvenida />
    </SessionProviders>
  );
}
