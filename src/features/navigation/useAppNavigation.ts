import { useRouter } from "expo-router";
import { useMemo } from "react";

import { TAB_HREFS, type Tab } from "./routes";

/**
 * Navegación de la app con nombres de negocio. Las pantallas no conocen las rutas:
 * si una ruta cambia, solo se edita aquí.
 */
export function useAppNavigation() {
  const router = useRouter();

  return useMemo(
    () => ({
      /** Cambia de pestaña. */
      navigate: (tab: Tab) => router.navigate(TAB_HREFS[tab]),
      openProduct: (productId: string) =>
        router.push({ pathname: "/product/[id]", params: { id: productId } }),
      openUserProfile: (userId: string) =>
        router.push({ pathname: "/user/[id]", params: { id: userId } }),
      openThread: (chatId: string) =>
        router.push({ pathname: "/chat/[id]", params: { id: chatId } }),
      /** Vuelve a la pantalla anterior; si no hay (enlace directo), al inicio. */
      back: () => (router.canGoBack() ? router.back() : router.replace("/")),
    }),
    [router],
  );
}
