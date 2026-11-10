import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import {
  STACK_SCREEN_OPTIONS,
  TRANSPARENT_NAVIGATION_THEME,
} from "@/features/navigation/stackOptions";
import { AppFrame } from "@/features/shared/AppFrame";
import { AppThemeProvider } from "@/features/shared/AppThemeProvider";

// Muestra de errores de renderizado de las pantallas con el contenedor por defecto de Expo Router
export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const FONTS = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
};

export const unstable_settings = {
  initialRouteName: "(app)",
};

/** Bienvenida para quien no tiene sesión y la app para quien sí; Expo Router redirige al cambiar la sesión. */
function RootNavigator() {
  const { status } = useAuth();

  // La splash nativa sigue visible hasta que se sabe si hay sesión,
  // así la pantalla de bienvenida (o la app) aparece sin parpadeos.
  useEffect(() => {
    if (status !== "loading") {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === "loading") return null;
  const isAuthenticated = status === "authenticated";

  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Protected
        guard={isAuthenticated}
        redirectTo={status === "unverified" ? "/verify" : "/bienvenida"}
      >
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);

  if (fontError) throw fontError;
  // La splash nativa sigue visible mientras cargan las fuentes
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <ThemeProvider value={TRANSPARENT_NAVIGATION_THEME}>
          <AppThemeProvider>
            <AuthProvider>
              <AppFrame>
                <RootNavigator />
              </AppFrame>
            </AuthProvider>
          </AppThemeProvider>
        </ThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
