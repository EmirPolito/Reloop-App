import { Image } from "expo-image";
import { useEffect } from "react";
import {
  type ImageSourcePropType,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { stickerPorId } from "../perfilStickers";

/** Flotado de los stickers alrededor del avatar */
const FLOTE = {
  /** Cuánto suben y bajan (px). Súbelo para más movimiento */
  amplitud: 4,
  /** Cuánto se inclinan (grados) */
  giro: 2,
  /** Duración de un ciclo completo (ms), uno por sticker para que no vayan sincronizados */
  duraciones: [3200, 3300, 3400, 3500],
  /** Retraso de arranque entre un sticker y el siguiente (ms) */
  desfase: 350,
} as const;

/** Lugares alrededor del avatar donde caen los stickers elegidos (en orden) */
const SLOTS_STICKERS: (ViewStyle & { rotate: string })[] = [
  { top: 53, left: "10%", rotate: "-12deg" },
  { top: 53, right: "13%", rotate: "14deg" },
  { top: 175, left: "-1%", rotate: "-15deg" },
  { top: 172, right: "-1%", rotate: "9deg" },
];

/** Stickers elegidos por el usuario, colocados alrededor del avatar y flotando suavemente. */
export function StickersFlotantes({ stickers }: { stickers: string[] }) {
  return stickers.slice(0, SLOTS_STICKERS.length).map((id, index) => {
    const sticker = stickerPorId(id);
    if (!sticker) return null;
    const { rotate, ...slot } = SLOTS_STICKERS[index];
    return (
      <StickerFlotante
        key={id}
        index={index}
        source={sticker.source}
        slot={slot}
        rotate={Number.parseFloat(rotate)}
      />
    );
  });
}

/** Sticker que flota: sube/baja y se inclina un poco, en bucle continuo.
 *  Usa una onda seno sobre un valor que va de 0 a 2π, así el bucle no tiene
 *  costuras ni saltos al reiniciar. Cada sticker tiene su propia duración,
 *  su retraso y (los impares) va en sentido contrario, para que no se muevan
 *  todos a la vez. Respeta "reducir movimiento" del sistema. */
function StickerFlotante({
  source,
  slot,
  rotate,
  index,
}: {
  source: ImageSourcePropType;
  slot: ViewStyle;
  /** Inclinación base en grados */
  rotate: number;
  index: number;
}) {
  const reducir = useReducedMotion();
  const fase = useSharedValue(0);
  const sentido = index % 2 === 0 ? 1 : -1;
  const duracion = FLOTE.duraciones[index % FLOTE.duraciones.length];

  useEffect(() => {
    if (reducir) return;
    fase.set(
      withDelay(
        index * FLOTE.desfase,
        withRepeat(
          withTiming(Math.PI * 2, {
            duration: duracion,
            easing: Easing.linear,
          }),
          -1,
          false,
        ),
      ),
    );
    return () => cancelAnimation(fase);
  }, [reducir, index, duracion, fase]);

  const estilo = useAnimatedStyle(() => {
    const onda = Math.sin(fase.value) * sentido; // -1 … 1
    return {
      transform: [
        { translateY: onda * FLOTE.amplitud },
        { rotate: `${rotate + onda * FLOTE.giro}deg` },
      ],
    };
  });

  return (
    /* El contenedor animado se rasteriza: cada frame solo mueve/gira un bitmap
       en vez de volver a dibujar imagen + sombra. La sombra va en una vista
       estática interior (con sombra en la vista animada cuesta mucho). */
    <Animated.View
      pointerEvents="none"
      shouldRasterizeIOS
      renderToHardwareTextureAndroid
      style={[styles.sticker, slot, estilo]}
    >
      <View style={styles.stickerSombra}>
        <Image
          source={source}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          style={styles.stickerImage}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: "absolute",
    zIndex: 30,
  },
  stickerSombra: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  stickerImage: { width: 104, height: 104 },
});
