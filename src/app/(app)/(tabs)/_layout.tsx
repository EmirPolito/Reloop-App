import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router/js-tabs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTabBar } from "@/features/navigation/AppTabBar";
import {
  gradienteSuaveModulos,
  LOCATIONS_MODULOS,
} from "@/features/perfil/Perfiltemas";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

export default function TabsLayout() {
  const { isDark, themeColor } = useAppTheme();
  const insets = useSafeAreaInsets();
  const backgroundColors = useMemo(
    () => gradienteSuaveModulos(themeColor, isDark),
    [themeColor, isDark],
  );

  return (
    <LinearGradient
      colors={backgroundColors}
      locations={LOCATIONS_MODULOS}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <Tabs
          tabBar={(props) => <AppTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: "transparent" },
            freezeOnBlur: true,
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
