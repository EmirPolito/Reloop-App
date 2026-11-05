import { DefaultTheme, type NativeStackNavigationOptions } from "expo-router";

/** Las pantallas son transparentes: el degradado de `AppFrame` queda detrás de todas. */
export const STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "fade",
  contentStyle: { backgroundColor: "transparent" },
};

/** Tema de React Navigation sin fondos propios (el fondo lo pone `AppFrame`). */
export const TRANSPARENT_NAVIGATION_THEME: typeof DefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
    card: "transparent",
  },
};
