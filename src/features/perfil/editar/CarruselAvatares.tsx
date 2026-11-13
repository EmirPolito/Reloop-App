import { Image } from "expo-image";
import { useRef, useState, type ComponentRef, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { OrbAvatar } from "@/components/ui/OrbAvatar";
import { ORBES } from "@/constants/orbes";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { getInitials } from "@/utils/text";
import { BrilloAvatar } from "../components/BrilloAvatar";
import { INTER, coloresEditar } from "./editarTema";

/** Lado del avatar del centro */
const LADO = 124;
/** Ancho que ocupa cada avatar en la fila (el paso del snap) */
const PASO = 100;
/** Tamaño de los avatares de los lados respecto al del centro */
const ESCALA_LATERAL = 0.5;

// ScrollView de gesture-handler: dentro del drawer, el de React Native pierde el gesto en Android
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * Posición del carrusel que corresponde a lo guardado en el perfil: 0 es "sin orbe"
 * (la foto actual o las iniciales) y de 1 a 10 son los orbes.
 */
export function indiceDeAvatar(photo: string | null, orb: number | null) {
  return photo || orb === null ? 0 : orb + 1;
}

/**
 * Selector de avatar: fila horizontal que se detiene con un avatar al centro. El del centro
 * se ve a tamaño completo y los de los lados encogen según la distancia, siguiendo el dedo
 * en el hilo de UI. React solo se entera cuando cambia el avatar centrado.
 */
export function CarruselAvatares({
  photo,
  name,
  isDark,
  inicial,
  onCambio,
}: {
  photo: string | null;
  name: string;
  isDark: boolean;
  /** Avatar guardado (ver indiceDeAvatar): va primero en la fila y centrado al abrir */
  inicial: number;
  onCambio: (indice: number) => void;
}) {
  const c = coloresEditar(isDark);
  const reduceMotion = useReducedMotion();
  const [ancho, setAncho] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof AnimatedScrollView>>(null);
  const scrollX = useSharedValue(0);
  const ultimo = ORBES.length;
  // Orden de la fila: el avatar guardado va primero y el resto conserva su orden. Cada
  // valor es un índice de avatar (0 = foto o iniciales, 1 a 10 = orbes). Se fija al montar.
  const [orden] = useState(() => [
    inicial,
    ...Array.from({ length: ultimo + 1 }, (_, i) => i).filter(
      (i) => i !== inicial,
    ),
  ]);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  useAnimatedReaction(
    () => Math.min(ultimo, Math.max(0, Math.round(scrollX.get() / PASO))),
    (posicion, anterior) => {
      if (anterior !== null && posicion !== anterior) {
        scheduleOnRN(onCambio, orden[posicion]);
      }
    },
  );

  const centrar = (indice: number) =>
    scrollRef.current?.scrollTo({ x: indice * PASO, animated: !reduceMotion });

  return (
    <View
      style={styles.carrusel}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
    >
      {ancho > 0 ? (
        <AnimatedScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PASO}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{
            paddingHorizontal: (ancho - PASO) / 2,
            alignItems: "center",
          }}
        >
          {orden.map((avatar, posicion) =>
            avatar === 0 ? (
              <Hueco
                key="neutro"
                indice={posicion}
                scrollX={scrollX}
                etiqueta={photo ? "Foto actual" : "Sin avatar"}
                onPress={centrar}
              >
                <View
                  style={[styles.neutro, { backgroundColor: c.avatarFondo }]}
                >
                  {photo ? (
                    <>
                      <Image
                        source={{ uri: optimizedImageUrl(photo, 400) ?? photo }}
                        contentFit="cover"
                        transition={200}
                        style={StyleSheet.absoluteFill}
                      />
                      <BrilloAvatar id="sheet-avatar" />
                    </>
                  ) : (
                    <Text
                      style={[INTER.medium, { fontSize: 40, color: c.texto }]}
                    >
                      {getInitials(name)}
                    </Text>
                  )}
                </View>
              </Hueco>
            ) : (
              <Hueco
                key={ORBES[avatar - 1].nombre}
                indice={posicion}
                scrollX={scrollX}
                etiqueta={`Avatar ${ORBES[avatar - 1].nombre}`}
                onPress={centrar}
              >
                <OrbAvatar orb={avatar - 1} name={name} size={LADO} />
              </Hueco>
            ),
          )}
        </AnimatedScrollView>
      ) : null}
    </View>
  );
}

/** Un lugar de la fila: escala y se atenúa según qué tan lejos está del centro */
function Hueco({
  indice,
  scrollX,
  etiqueta,
  onPress,
  children,
}: {
  indice: number;
  scrollX: SharedValue<number>;
  etiqueta: string;
  onPress: (indice: number) => void;
  children: ReactNode;
}) {
  const estilo = useAnimatedStyle(() => {
    const distancia = Math.abs(scrollX.get() / PASO - indice);
    return {
      opacity: interpolate(
        distancia,
        [0, 1, 2.5],
        [1, 0.9, 0.4],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            distancia,
            [0, 1],
            [1, ESCALA_LATERAL],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.hueco, estilo]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={() => onPress(indice)}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carrusel: { alignSelf: "stretch", height: LADO + 8 },
  // El avatar es más ancho que su hueco: sobresale por igual a ambos lados
  hueco: { width: PASO, alignItems: "center", justifyContent: "center" },
  neutro: {
    width: LADO,
    height: LADO,
    borderRadius: LADO / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
