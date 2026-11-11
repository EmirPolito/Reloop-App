import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import {
  ProfilePostCard,
  profilePostCardHeight,
} from "@/features/perfil/components/ProfilePostCard";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import type { Product } from "../types";

const ANGLE = 10; // Inclinación tarjetas de los lados
const DROP = 13; // Caída moderada
const PAD_V = 20; // Espaciado arriba
const PAD_BOTTOM = 30; // Espaciado abajo
const OFFSETS = [-2, -1, 0, 1, 2];
const PAIR_OFFSET = 0.8;

/** Con más publicaciones que esto solo se montan las cercanas a la actual */
const MAX_MONTADAS = 15;
const VENTANA = 4;

/**
 * Todo el abanico se mueve con UNA posición animada: cada toque solo cambia el destino y
 * el spring sigue desde donde va (con su velocidad), así los toques rápidos no reinician
 * nada ni hacen saltar tarjetas. Casi críticamente amortiguado: rápido, suave, sin rebote.
 */
const SPRING_ABANICO = { mass: 1, stiffness: 320, damping: 34 };

/**
 * Orden de apilado en 3 niveles: solo cambia cuando la tarjeta cruza la mitad del camino
 * (donde las tarjetas se ven simétricas). Cambiarlo en cada cuadro reordenaba las vistas
 * en Android y hacía parpadear las imágenes.
 */
function nivel(ad: number) {
  "worklet";
  return ad < 0.5 ? 3 : ad < 1.5 ? 2 : 1;
}

/** Botón: se hunde rápido al presionar y vuelve suave al soltar */
const PRESION = { duration: 100, easing: Easing.out(Easing.quad) };
const SOLTAR = { duration: 160, easing: Easing.out(Easing.quad) };

const mod = (a: number, n: number) => ((a % n) + n) % n;

interface ProductFanProps {
  items: Product[];
  onOpen: (productId: string) => void;
  cardWidth?: number;
}

/** Posición discreta de una tarjeta para un paso (decide qué hace cada toque) */
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

/** Distancia continua (con decimales) de la tarjeta `i` al centro, dando la vuelta */
function distancia(i: number, pos: number, n: number) {
  "worklet";
  const r = (((i - pos) % n) + n) % n;
  return r > n / 2 ? r - n : r;
}

/* ------------------------------------------------------------------ */
/* Una tarjeta del carrusel                                           */
/* ------------------------------------------------------------------ */
interface FanSlotProps {
  item: Product;
  index: number;
  total: number;
  posicion: SharedValue<number>;
  cardWidth: number;
  spread: number;
  left: number;
  onPressIndex: (index: number) => void;
}

const FanSlot = memo(function FanSlot({
  item,
  index,
  total,
  posicion,
  cardWidth,
  spread,
  left,
  onPressIndex,
}: FanSlotProps) {
  const onPress = useCallback(() => onPressIndex(index), [onPressIndex, index]);

  // Todo se calcula en el hilo de la interfaz a partir de la posición: sin estado por tarjeta
  const estilo = useAnimatedStyle(() => {
    const d = distancia(index, posicion.value, total);
    const ad = Math.abs(d);

    if (total === 2) {
      // Pareja: las dos quedan fijas a los lados; la activa pasa al frente
      const lado = index === 0 ? -PAIR_OFFSET : PAIR_OFFSET;
      const activa = Math.max(0, 1 - ad);
      return {
        zIndex: activa >= 0.5 ? 2 : 1,
        opacity: 1,
        transform: [
          { translateX: lado * spread },
          { translateY: DROP * PAIR_OFFSET },
          { rotate: `${lado * ANGLE}deg` },
          { scale: 1 - 0.06 * PAIR_OFFSET },
        ],
      };
    }

    // Se desvanece al acercarse al punto donde da la vuelta (con 3 tarjetas es ±1.5):
    // así el cambio de lado nunca se ve
    const borde = interpolate(
      total / 2 - ad,
      [0, 0.5],
      [0, 1],
      Extrapolation.CLAMP,
    );
    // Solo se ven la central y las dos de los lados: más allá de 1 se desvanece rápido, así
    // con toques rápidos no aparece una tarjeta "de más"
    const opacidad =
      interpolate(ad, [0, 1, 1.6], [1, 1, 0], Extrapolation.CLAMP) * borde;

    return {
      zIndex: nivel(ad),
      opacity: opacidad,
      transform: [
        {
          translateX: interpolate(
            d,
            OFFSETS,
            [-spread * 1.5, -spread, 0, spread, spread * 1.5],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            d,
            OFFSETS,
            [DROP * 1.8, DROP, 0, DROP, DROP * 1.8],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotate: `${interpolate(
            d,
            OFFSETS,
            [-ANGLE * 1.4, -ANGLE, 0, ANGLE, ANGLE * 1.4],
            Extrapolation.CLAMP,
          )}deg`,
        },
        {
          scale: interpolate(
            d,
            OFFSETS,
            [0.88, 0.94, 1, 0.94, 0.88],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // El precio solo se ve en la tarjeta del centro (se desvanece al alejarse)
  const estiloPrecio = useAnimatedStyle(() => {
    if (total === 1) return { opacity: 1 };
    const ad = Math.abs(distancia(index, posicion.value, total));
    return { opacity: Math.max(0, 1 - ad) };
  });

  return (
    // Android: sin esto, al estar semitransparente pinta por separado el fondo blanco y la
    // foto, y el blanco se transparenta ("card blanca"). Así se compone como una sola capa.
    <Animated.View
      needsOffscreenAlphaCompositing
      renderToHardwareTextureAndroid
      style={[{ position: "absolute", left, top: PAD_V }, estilo]}
    >
      <ProfilePostCard
        item={item}
        cardWidth={cardWidth}
        onPress={onPress}
        priceStyle={estiloPrecio}
      />
    </Animated.View>
  );
});

/* ------------------------------------------------------------------ */
/* Tarjeta de relleno para cuando el usuario solo tiene 1 publicación */
/* ------------------------------------------------------------------ */
interface PlaceholderFanSlotProps {
  offset: -1 | 1;
  cardWidth: number;
  cardHeight: number;
  spread: number;
  left: number;
  isDark: boolean;
}

const PlaceholderFanSlot = memo(function PlaceholderFanSlot({
  offset,
  cardWidth,
  cardHeight,
  spread,
  left,
  isDark,
}: PlaceholderFanSlotProps) {
  const translateX = offset * spread;
  const translateY = DROP;
  const rotate = `${offset * ANGLE}deg`;
  const scale = 0.94;

  const bgOuter = isDark ? "#1E293B" : "#FFFFFF";
  const bgInner = isDark ? "#162032" : "#F3F4F6";
  const borderColor = isDark ? "#334155" : "#E5E7EB";
  const textMuted = isDark ? "#64748B" : "#9CA3AF";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        top: PAD_V,
        zIndex: 1,
        width: cardWidth,
        height: cardHeight,
        borderRadius: 35,
        backgroundColor: bgOuter,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0.25 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: 35,
          margin: 3,
          backgroundColor: bgInner,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
          gap: 6,
        }}
      >
        <AppIcon name="photo" size={24} color={textMuted} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: textMuted,
            textAlign: "center",
            lineHeight: 14,
          }}
        >
          Sin más publicaciones
        </Text>
      </View>
    </View>
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
  const { isDark } = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [step, setStep] = useState(0);
  const total = items.length;

  // Posición continua que sigue a `step` con un spring interrumpible
  const posicion = useSharedValue(0);
  useEffect(() => {
    posicion.set(withSpring(step, SPRING_ABANICO));
  }, [step, posicion]);

  const goNext = useCallback(() => setStep((s) => s + 1), []);
  const goPrev = useCallback(() => setStep((s) => s - 1), []);

  // Refs para que el toque de cada tarjeta sea estable: tocar no re-renderiza las tarjetas
  const stepRef = useRef(step);
  const itemsRef = useRef(items);
  useEffect(() => {
    stepRef.current = step;
    itemsRef.current = items;
  }, [step, items]);

  const onPressIndex = useCallback(
    (index: number) => {
      const lista = itemsRef.current;
      const { offset, active } = slotFor(index, stepRef.current, lista.length);
      if (active) onOpen(lista[index].id);
      else if (lista.length === 2 || offset > 0) goNext();
      else goPrev();
    },
    [onOpen, goNext, goPrev],
  );

  // Botón Siguiente: se hunde un poco al presionar (respuesta inmediata)
  const escalaBoton = useSharedValue(1);
  const estiloBoton = useAnimatedStyle(() => ({
    transform: [{ scale: escalaBoton.value }],
  }));

  if (!total) return null;

  const cardWidth = cardWidthProp ?? Math.round(containerWidth * 0.44);
  const cardHeight = profilePostCardHeight(cardWidth);
  const spread = cardWidth * 0.5;
  const left = (containerWidth - cardWidth) / 2;
  const stageHeight = cardHeight + PAD_V * 2 + DROP;
  const activeIndex = mod(step, total);

  return (
    <View
      className="w-full items-center"
      style={{ paddingBottom: PAD_BOTTOM }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 ? (
        <View style={{ width: containerWidth, height: stageHeight }}>
          {total === 1 ? (
            <>
              <PlaceholderFanSlot
                offset={-1}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                spread={spread}
                left={left}
                isDark={isDark}
              />
              <PlaceholderFanSlot
                offset={1}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                spread={spread}
                left={left}
                isDark={isDark}
              />
            </>
          ) : null}
          {items.map((product, i) => {
            // Con pocas publicaciones se montan todas (nada aparece/desaparece de golpe)
            if (
              total > MAX_MONTADAS &&
              Math.abs(slotFor(i, step, total).offset) > VENTANA
            ) {
              return null;
            }
            return (
              <FanSlot
                key={product.id}
                item={product}
                index={i}
                total={total}
                posicion={posicion}
                cardWidth={cardWidth}
                spread={spread}
                left={left}
                onPressIndex={onPressIndex}
              />
            );
          })}
        </View>
      ) : null}

      {total > 1 ? (
        <View className="mt-1 items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver siguiente publicación"
            onPress={goNext}
            onPressIn={() => escalaBoton.set(withTiming(0.96, PRESION))}
            onPressOut={() => escalaBoton.set(withTiming(1, SOLTAR))}
          >
            <Animated.View
              style={estiloBoton}
              className="rounded-full bg-neutral-900 px-6 py-2.5"
            >
              <Text className="text-sm font-semibold text-white">
                Siguiente
              </Text>
            </Animated.View>
          </Pressable>

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
