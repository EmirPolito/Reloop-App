import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { useAuth } from "@/features/auth/AuthProvider";
import { useAppTheme } from "./AppThemeProvider";
import { APP_BACKGROUND } from "./constants";

/** Fondo neutral, barra de estado transparente y contenedor base de la app. */
export function AppFrame({ children }: PropsWithChildren) {
  const { isDark, styles } = useAppTheme();
  const { status } = useAuth();
  const isDarkTheme = status === "authenticated" && isDark;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? APP_BACKGROUND.dark : APP_BACKGROUND.light },
      ]}
    >
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <View style={styles.appContainer}>{children}</View>
    </View>
  );
}
