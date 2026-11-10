import { useIsFocused } from "expo-router";
import type { PropsWithChildren } from "react";
import { Platform, View } from "react-native";

/**
 * Oculta la pestaña cuando no está en foco únicamente en web.
 * En iOS y Android las pestañas inactivas se desacoplan de forma nativa
 * mediante react-native-screens sin forzar recálculos pesados de layout en cada cambio.
 */
export function TabScene({ children }: PropsWithChildren) {
  const isFocused = useIsFocused();

  if (Platform.OS !== "web") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={[{ flex: 1 }, !isFocused && { display: "none" }]}>
      {children}
    </View>
  );
}
