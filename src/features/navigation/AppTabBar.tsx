import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useCallback } from "react";

import { Navegacion } from "@/components/navbar/Navegacion";
import { useChats } from "@/features/chats/ChatProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { TAB_ROUTE_NAMES, tabFromRouteName, type Tab } from "./routes";

/** Conecta el navegador de pestañas con la barra animada de la app. */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark } = useAppTheme();
  const { chats } = useChats();
  const activeTab = tabFromRouteName(state.routes[state.index].name) ?? "home";

  const handleNavigate = useCallback(
    (tab: Tab) => navigation.navigate(TAB_ROUTE_NAMES[tab]),
    [navigation],
  );

  return (
    <Navegacion
      activeTab={activeTab}
      onNavigate={handleNavigate}
      isDark={isDark}
      hasUnreadChats={chats.some((chat) => chat.unread)}
    />
  );
}
