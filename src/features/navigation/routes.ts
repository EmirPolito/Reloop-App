import type { Href } from "expo-router";

export type Tab = "home" | "favorites" | "create" | "chats" | "profile";

/** Nombre de la ruta de cada pestaña (archivo en `src/app/(app)/(tabs)`). */
export const TAB_ROUTE_NAMES: Record<Tab, string> = {
  home: "index",
  favorites: "favorites",
  create: "create",
  chats: "chats",
  profile: "profile",
};

export const TAB_HREFS: Record<Tab, Href> = {
  home: "/",
  favorites: "/favorites",
  create: "/create",
  chats: "/chats",
  profile: "/profile",
};

/** Pestaña a la que pertenece una ruta del navegador de pestañas; `undefined` si no es ninguna. */
export function tabFromRouteName(routeName: string): Tab | undefined {
  return (Object.keys(TAB_ROUTE_NAMES) as Tab[]).find(
    (tab) => TAB_ROUTE_NAMES[tab] === routeName,
  );
}
