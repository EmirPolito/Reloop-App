import { type ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { EASE, ENTRADA_BASE, ENTRADA_PASO, ENTRADA_DURACION, LAYOUT } from "./drawerTheme";

/** Entrada escalonada (fade + subida corta). `deslizar` anima el reacomodo
 *  solo en los bloques que quedan debajo de otros que cambian de alto. */
export function Aparece({
  index,
  deslizar = false,
  children,
}: {
  index: number;
  deslizar?: boolean;
  children: ReactNode;
}) {
  return (
    <Animated.View
      layout={deslizar ? LAYOUT : undefined}
      entering={FadeInDown.delay(ENTRADA_BASE + index * ENTRADA_PASO)
        .duration(ENTRADA_DURACION)
        .easing(EASE)}
    >
      {children}
    </Animated.View>
  );
}
