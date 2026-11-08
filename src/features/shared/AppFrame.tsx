import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { useAuth } from "@/features/auth/AuthProvider";
import { useAppTheme } from "./AppThemeProvider";

const LIGHT_BACKGROUND = "#f7f7f7";
const DARK_BACKGROUND = "#0F172A";

/** Fondo neutral, barra de estado transparente y contenedor base de la app. */
export function AppFrame({ children }: PropsWithChildren) {
  const { isDark, styles } = useAppTheme();
  const { status } = useAuth();
  const isDarkTheme = status === "authenticated" && isDark;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND },
      ]}
    >
      <StatusBar style={isDarkTheme ? "light" : "dark"} />
      <View style={styles.appContainer}>{children}</View>
    </View>
  );
}
