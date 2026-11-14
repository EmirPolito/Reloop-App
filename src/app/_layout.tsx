import { useFonts } from "expo-font";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { AnimatedSplash } from "@/features/intro/efecto-entrada";
import {
  STACK_SCREEN_OPTIONS,
  TRANSPARENT_NAVIGATION_THEME,
} from "@/features/navigation/stackOptions";
import { AppFrame } from "@/features/shared/AppFrame";
import { AppThemeProvider } from "@/features/shared/AppThemeProvider";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const FONTS = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,

  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
};

export const unstable_settings = {
  anchor: "(app)",
};

/**
 * Animación de entrada. Se monta sobre toda la app y espera a que se sepa si hay
 * sesión (status !== "loading") antes de expandirse; al terminar, la app ya está en la
 * pantalla que le corresponde. La splash nativa la oculta el propio AnimatedSplash cuando
 * el logo está listo.
 */
function SplashGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  return (
    <AnimatedSplash isAppReady={status !== "loading"}>
      {children}
    </AnimatedSplash>
  );
}

/** Inicio de sesión para quien no tiene sesión y la app (inicio) para quien sí; Expo Router redirige al cambiar la sesión. */
function RootNavigator() {
  const { status } = useAuth();

  // Mientras se resuelve la sesión no se monta nada: la animación sigue en pantalla.
  if (status === "loading") return null;
  const isAuthenticated = status === "authenticated";

  return (
    <Stack screenOptions={STACK_SCREEN_OPTIONS}>
      <Stack.Protected
        guard={isAuthenticated}
        redirectTo={status === "unverified" ? "/verify" : "/login"}
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
              <SplashGate>
                <AppFrame>
                  <RootNavigator />
                </AppFrame>
              </SplashGate>
            </AuthProvider>
          </AppThemeProvider>
        </ThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
