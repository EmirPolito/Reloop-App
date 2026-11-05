import type { ComponentProps, ComponentType } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";

type LayoutAnimProps = {
  entering?: ComponentProps<typeof Animated.View>["entering"];
  exiting?: ComponentProps<typeof Animated.View>["exiting"];
  layout?: ComponentProps<typeof Animated.View>["layout"];
};

// Cast para evitar los tipos con SharedValue en cada prop (incluida `key`)
const AnimatedPressable = Animated.createAnimatedComponent(
  Pressable,
) as unknown as ComponentType<
  Omit<PressableProps, "style"> &
    LayoutAnimProps & { style?: StyleProp<ViewStyle> | StyleProp<ViewStyle>[] }
>;

// Igual que PressableFeedback de HeroUI: scale con withTiming (sin rebote),
// controlado por un shared value `isPressed`. Duración acortada para sentirse ágil.
const PRESS_TIMING = { duration: 160, easing: EASE_OUT };

export type PressableScaleProps = Omit<PressableProps, "style"> &
  LayoutAnimProps & {
    /** Escala al presionar (1 = sin cambio). */
    scaleTo?: number;
    style?: StyleProp<ViewStyle>;
  };

/** Pressable que se encoge al presionarlo, animado en el hilo de UI con Reanimated. */
export function PressableScale({
  scaleTo = 0.95,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const isPressed = useSharedValue(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(isPressed.value ? scaleTo : 1, PRESS_TIMING) },
    ],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        isPressed.set(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        isPressed.set(false);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle] as StyleProp<ViewStyle>}
    >
      {children}
    </AnimatedPressable>
  );
}
