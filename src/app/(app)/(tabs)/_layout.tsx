import { LinearGradient } from "expo-linear-gradient";
import { usePathname } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTabBar } from "@/features/navigation/AppTabBar";
import { gradienteAppBackground } from "@/features/perfil/Perfiltemas";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export default function TabsLayout() {
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isProfile = pathname === "/profile";

  const backgroundColors = useMemo(
    () => gradienteAppBackground(themeColor, isDark),
    [themeColor, isDark],
  );

  // En el perfil el degradado arranca un poco más abajo (y: 0.04 ≈ 4 % pantalla)
  const gradientStart = isProfile ? { x: 0, y: 0.09 } : { x: 0, y: 0 };

  return (
    <LinearGradient
      colors={backgroundColors}
      start={gradientStart}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <Tabs
          tabBar={(props) => <AppTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: "transparent" },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="favorites" />
          <Tabs.Screen name="create" />
          <Tabs.Screen name="chats" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
});
