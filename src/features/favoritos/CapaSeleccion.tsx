import { Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { colorSeleccion } from "@/components/ui/colorSeleccion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

/**
 * Capa que, en el modo de selección de Favoritos, cubre una tarjeta: tocarla la marca o la
 * desmarca. Marcada, la tarjeta se pinta con una capa roja clara (como los chats elegidos),
 * sin círculo ni palomita.
 */
export function CapaSeleccion({
  etiqueta,
  marcada,
  onPress,
  radio,
}: {
  etiqueta: string;
  marcada: boolean;
  onPress: () => void;
  /** Esquinas de la tarjeta que cubre: la capa las sigue */
  radio: number;
}) {
  const { isDark } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: marcada }}
      onPress={onPress}
      style={StyleSheet.absoluteFill}
    >
      {marcada ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radio, backgroundColor: colorSeleccion(isDark) },
          ]}
        />
      ) : null}
    </Pressable>
  );
}
