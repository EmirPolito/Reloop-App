import { Tabs } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTabBar } from "@/features/navigation/AppTabBar";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { APP_BACKGROUND } from "@/features/shared/constants";

export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? APP_BACKGROUND.dark : APP_BACKGROUND.light },
      ]}
    >
      <View style={styles.inner}>
        <Tabs
          tabBar={(props) => <AppTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            // Cada pestaña deja libre el espacio de la barra de estado...
            sceneStyle: {
              backgroundColor: "transparent",
              paddingTop: insets.top,
            },
            freezeOnBlur: true,
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="favorites" />
          <Tabs.Screen name="create" />
          <Tabs.Screen name="chats" />
          {/* ...salvo Perfil: su portada llega hasta arriba, detrás de la hora */}
          <Tabs.Screen
            name="profile"
            options={{ sceneStyle: { backgroundColor: "transparent" } }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
});
