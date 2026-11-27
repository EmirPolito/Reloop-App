import { DefaultTheme, type NativeStackNavigationOptions } from "expo-router";

/** Las pantallas son transparentes: el degradado de `AppFrame` queda detrás de todas. */
export const STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "fade",
  // Corto (~350 ms de serie): el cambio de pantalla se siente inmediato
  animationDuration: 110,
  contentStyle: { backgroundColor: "transparent" },
  // Desde iOS 26 cada pantalla pone sola una neblina blanca en las orillas de lo que se
  // desplaza (arriba se veía sobre la portada del perfil, detrás de la hora). La app ya tiene
  // sus propias cabeceras y velos: sin ese efecto
  scrollEdgeEffects: {
    top: "hidden",
    bottom: "hidden",
    left: "hidden",
    right: "hidden",
  },
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
