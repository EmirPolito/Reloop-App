import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";

import {
  ProfilePostCard,
  profilePostCardHeight,
} from "@/features/perfil/components/ProfilePostCard";
import { Text } from "@/features/shared/Text";
import type { Product } from "../types";

const ANGLE = 10; // Inclinación tarjetas de los lados
const DROP = 13; // Caída moderada
const PAD_V = 20; // Espaciado arriba
const PAD_BOTTOM = 30; // Espaciado abajo
const SLIDE_MS = 250;
const OFFSETS = [-2, -1, 0, 1, 2];
const PAIR_OFFSET = 0.8;

const mod = (a: number, n: number) => ((a % n) + n) % n;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ProductFanProps {
  items: Product[];
  onOpen: (productId: string) => void;
  cardWidth?: number;
}

function slotFor(i: number, step: number, n: number) {
  if (n === 1) return { offset: 0, active: true };
  if (n === 2) {
    return {
      offset: i === 0 ? -PAIR_OFFSET : PAIR_OFFSET,
      active: i === mod(step, 2),
    };
  }
  const r = mod(i - step, n);
  const d = r > n / 2 ? r - n : r;
  return { offset: d, active: d === 0 };
}

/* ------------------------------------------------------------------ */
/* Una tarjeta del carrusel                                           */
/* ------------------------------------------------------------------ */
interface FanSlotProps {
  item: Product;
  offset: number;
  active: boolean;
  cardWidth: number;
  spread: number;
  left: number;
  onPress: () => void;
}

const FanSlot = memo(function FanSlot({
  item,
  offset,
  active,
  cardWidth,
  spread,
  left,
  onPress,
}: FanSlotProps) {
  const anim = useRef(new Animated.Value(offset)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const prevOffset = useRef(offset);

  useEffect(() => {
    const prev = prevOffset.current;
    if (prev === offset) return;
    prevOffset.current = offset;

    const delta = offset - prev;

    if (Math.abs(delta) > 1.5) {
      anim.setValue(offset);
    } else {
      // Usar spring en el desplazamiento permite toques rápidos sin tirones ni flickers
      Animated.spring(anim, {
        toValue: offset,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
  }, [anim, offset]);

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: active ? 1 : 0,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [activeAnim, active]);

  const translateX = anim.interpolate({
    inputRange: OFFSETS,
    outputRange: [-spread * 1.5, -spread, 0, spread, spread * 1.5],
    extrapolate: "clamp",
  });

  const translateY = anim.interpolate({
    inputRange: OFFSETS,
    outputRange: [DROP * 1.8, DROP, 0, DROP, DROP * 1.8],
    extrapolate: "clamp",
  });

  const rotate = anim.interpolate({
    inputRange: OFFSETS,
    outputRange: [
      `${-ANGLE * 1.4}deg`,
      `${-ANGLE}deg`,
      "0deg",
      `${ANGLE}deg`,
      `${ANGLE * 1.4}deg`,
    ],
    extrapolate: "clamp",
  });

  const scale = anim.interpolate({
    inputRange: OFFSETS,
    outputRange: [0.88, 0.94, 1, 0.94, 0.88],
    extrapolate: "clamp",
  });

  const opacity = anim.interpolate({
    inputRange: OFFSETS,
    outputRange: [0, 1, 1, 1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{
        position: "absolute",
        left,
        top: PAD_V,
        zIndex: active ? 3 : Math.abs(offset) <= 1 ? 2 : 1,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    >
      <ProfilePostCard
        item={item}
        cardWidth={cardWidth}
        onPress={onPress}
        priceOpacity={activeAnim}
      />
    </Animated.View>
  );
});

/* ------------------------------------------------------------------ */
/* Carrusel en abanico                                                 */
/* ------------------------------------------------------------------ */
export const ProductFan = memo(function ProductFan({
  items,
  onOpen,
  cardWidth: cardWidthProp,
}: ProductFanProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [step, setStep] = useState(0);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const total = items.length;

  const goNext = useCallback(() => setStep((s) => s + 1), []);
  const goPrev = useCallback(() => setStep((s) => s - 1), []);

  // Efecto táctil continuo en el botón (inmediato al presionar/soltar)
  const handlePressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [buttonScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [buttonScale]);

  if (!total) return null;

  // Tamaño de tarjeta compacto (42% del ancho disponible)
  const cardWidth = cardWidthProp ?? Math.round(containerWidth * 0.44);
  const cardHeight = profilePostCardHeight(cardWidth);
  const spread = cardWidth * 0.6;
  const left = (containerWidth - cardWidth) / 2;
  const stageHeight = cardHeight + PAD_V * 2 + DROP;
  const activeIndex = mod(step, total);

  return (
    <View
      className="w-full items-center"
      style={{ paddingBottom: total > 1 ? PAD_BOTTOM : 0 }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 ? (
        <View style={{ width: containerWidth, height: stageHeight }}>
          {items.map((product, i) => {
            const { offset, active } = slotFor(i, step, total);
            if (Math.abs(offset) > 2) return null;

            return (
              <FanSlot
                key={product.id}
                item={product}
                offset={offset}
                active={active}
                cardWidth={cardWidth}
                spread={spread}
                left={left}
                onPress={
                  active
                    ? () => onOpen(product.id)
                    : total === 2 || offset > 0
                      ? goNext
                      : goPrev
                }
              />
            );
          })}
        </View>
      ) : null}

      {total > 1 ? (
        <View className="mt-1 items-center gap-3">
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Ver siguiente publicación"
            onPress={goNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={{ transform: [{ scale: buttonScale }] }}
            className="rounded-full bg-neutral-900 px-6 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">Siguiente</Text>
          </AnimatedPressable>

          {/* Indicador de posición */}
          {total <= 7 ? (
            <View className="flex-row gap-1.5">
              {items.map((product, i) => (
                <View
                  key={product.id}
                  className={`h-1.5 rounded-full ${
                    i === activeIndex
                      ? "w-1.5 bg-neutral-900"
                      : "w-1.5 bg-neutral-300"
                  }`}
                />
              ))}
            </View>
          ) : (
            <Text className="text-xs text-neutral-400">
              {activeIndex + 1} / {total}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
});
