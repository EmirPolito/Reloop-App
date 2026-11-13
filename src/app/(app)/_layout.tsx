import { Stack } from "expo-router";

import { useAuth } from "@/features/auth/AuthProvider";
import { STACK_SCREEN_OPTIONS } from "@/features/navigation/stackOptions";
import { NotificationBannerHost } from "@/features/notificaciones/components/NotificationBannerHost";
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
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="user/[id]" />
        <Stack.Screen name="editar-perfil" />
        <Stack.Screen name="notificaciones" />
      </Stack>
      {/* Después de la pila: el banner flota encima de cualquier pantalla */}
      <NotificationBannerHost />
      {/* Configuración inicial de las cuentas nuevas (no se puede cerrar hasta terminar) */}
      <SheetBienvenida />
    </SessionProviders>
  );
}
