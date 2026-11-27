import { Stack } from "expo-router";
import { PortalHost } from "heroui-native/portal";

import { useAuth } from "@/features/auth/AuthProvider";
import { AvisoHost } from "@/features/avisos/AvisosProvider";
import { STACK_SCREEN_OPTIONS } from "@/features/navigation/opcionesPila";
import { ContenedorBanners } from "@/features/notificaciones/components/ContenedorBanners";
import { BarraNavegacion } from "@/features/navigation/BarraNavegacion";
import { SheetBienvenida } from "@/features/onboarding/SheetBienvenida";
import { HOST_SESION } from "@/features/perfil/editar/SheetEditar";
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
        {/* Sin la animación de la pila: entra y sale con la del módulo (corta) */}
        <Stack.Screen name="chat/[id]" options={{ animation: "none" }} />
        {/* Sin la animación de la pila: entran y salen con la de los módulos (TabScene) */}
        <Stack.Screen name="user/[id]" options={{ animation: "none" }} />
        <Stack.Screen name="seguidores/[id]" options={{ animation: "none" }} />
        <Stack.Screen name="editar-perfil" options={{ animation: "none" }} />
        {/* Sin la animación de la pila: entra y sale con la de los módulos (TabScene) */}
        <Stack.Screen name="notificaciones" options={{ animation: "none" }} />
        <Stack.Screen name="buscar-chats" options={{ animation: "none" }} />
        <Stack.Screen name="tarjetas" options={{ animation: "none" }} />
        <Stack.Screen name="legal/[documento]" />
        <Stack.Screen name="premium" />
        {/* Como los demás módulos: una pantalla normal de la pila (no un modal). Encima de un
            modal, en iPhone lo que se abría (una publicación, un perfil) salía como hoja oscura
            con el contenido más abajo. Así se abre normal y, al regresar, la búsqueda sigue
            donde se quedó. Sin la animación de la pila: entra y sale con la del módulo */}
        <Stack.Screen name="buscar" options={{ animation: "none" }} />
      </Stack>
      {/* La barra de navegación: una sola, fuera de la pila, así no se duplica ni se anima por
          separado al ir y volver de notificaciones o de un perfil */}
      <BarraNavegacion />
      {/* Después de la pila: el banner flota encima de cualquier pantalla */}
      <ContenedorBanners />
      {/* Avisos de la app (republicada, eliminada...), con el mismo diseño */}
      <AvisoHost />
      {/* Configuración inicial de las cuentas nuevas (no se puede cerrar hasta terminar) */}
      <SheetBienvenida />
      {/* Capa de drawers que necesitan la sesión (p. ej., la vista previa de la tarjeta) */}
      <PortalHost name={HOST_SESION} />
    </SessionProviders>
  );
}
