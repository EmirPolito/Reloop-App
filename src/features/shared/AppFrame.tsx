import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/AuthProvider";
import { useAppTheme } from "./AppThemeProvider";

const LIGHT_BACKGROUND: [string, string, ...string[]] = [
  "#C5B6F5",
  "#A9C9FF",
  "#94D6F3",
  "#79BDEB",
];
const DARK_BACKGROUND: [string, string, ...string[]] = [
  "#25113C",
  "#10203A",
  "#112536",
  "#35152D",
];

/** Fondo degradado, barra de estado y área segura de toda la app. */
export function AppFrame({ children }: PropsWithChildren) {
  const { isDark, styles } = useAppTheme();
  const { status } = useAuth();

  return (
    <LinearGradient
      colors={isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <StatusBar
        style={status === "authenticated" && isDark ? "light" : "dark"}
      />
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.appContainer}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}
