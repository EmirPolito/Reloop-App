import type { Href } from "expo-router";

export type Tab = "home" | "favorites" | "create" | "chats" | "profile";

export const TAB_HREFS: Record<Tab, Href> = {
  home: "/",
  favorites: "/favorites",
  create: "/create",
  chats: "/chats",
  profile: "/profile",
};

/** Qué muestra la barra de navegación en una ruta */
export interface EstadoBarra {
  visible: boolean;
  /** Pestaña marcada; `null` si ninguna (notificaciones, perfiles de otras personas) */
  activeTab: Tab | null;
  /** En la pantalla de notificaciones la campana queda marcada */
  notificaciones: boolean;
}

/**
 * La barra es una sola para toda la app y se decide por la ruta: aparece en las pestañas, en
 * las notificaciones y en el perfil de otras personas; se oculta en el resto (publicación,
 * conversación, editar perfil).
 */
export function estadoBarraParaRuta(pathname: string): EstadoBarra {
  if (pathname === "/notificaciones") {
    return { visible: true, activeTab: null, notificaciones: true };
  }
  if (pathname.startsWith("/user/")) {
    return { visible: true, activeTab: null, notificaciones: false };
  }
  const tab = (Object.keys(TAB_HREFS) as Tab[]).find(
    (candidata) => TAB_HREFS[candidata] === pathname,
  );
  return tab
    ? { visible: true, activeTab: tab, notificaciones: false }
    : { visible: false, activeTab: null, notificaciones: false };
}
