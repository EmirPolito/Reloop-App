import { useIsFocused } from "expo-router";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

/**
 * Oculta la pestaña cuando no está en foco. En iOS y Android las pestañas inactivas
 * se desacoplan solas, pero en web siguen dibujadas debajo y se transparentan a través
 * de las pantallas sin fondo propio. Ocultarlas conserva su estado y su scroll.
 */
export function TabScene({ children }: PropsWithChildren) {
  const isFocused = useIsFocused();
  return (
    <View style={[{ flex: 1 }, !isFocused && { display: "none" }]}>
      {children}
    </View>
  );
}
