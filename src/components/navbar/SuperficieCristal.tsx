import { BlurView } from "expo-blur";
import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";

import type { Estilos } from "./estilos";

/** El fondo de cristal de la cápsula, el botón de crear y el menú: tinte + desenfoque */
export const SuperficieCristal = memo(function SuperficieCristal({
  isDark,
  styles,
}: {
  isDark: boolean;
  styles: Estilos;
}) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.cristalTinte]}
      />
      {/* En Android el desenfoque no se ve bien: queda solo el tinte */}
      {Platform.OS !== "android" && (
        <BlurView
          intensity={30}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      )}
    </>
  );
});
