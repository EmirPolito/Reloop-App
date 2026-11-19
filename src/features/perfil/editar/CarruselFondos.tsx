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

/** Lado de la imagen del centro */
const LADO = 124;
/** Ancho que ocupa cada imagen en la fila (el paso del snap) */
const PASO = 100;
/** Tamaño de las imágenes de los lados respecto al del centro */
const ESCALA_LATERAL = 0.5;
const RADIO = 26;

// ScrollView de gesture-handler: dentro del drawer, el de React Native pierde el gesto en Android
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * Selector de fondo de Editar perfil: fila horizontal de imágenes cuadradas que se detiene
 * con una al centro. La del centro se ve completa y las de los lados encogen según la
 * distancia, siguiendo el dedo en el hilo de UI.
 */
export function CarruselFondos({
  imagenes,
  onCambio,
}: {
  /** Imágenes de la app (resultado de `require`) o una con `uri` (el fondo actual) */
  imagenes: readonly (number | { uri: string })[];
  /** Índice de la imagen que queda al centro */
  onCambio: (indice: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [ancho, setAncho] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof AnimatedScrollView>>(null);
  const scrollX = useSharedValue(0);
  const ultimo = imagenes.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  useAnimatedReaction(
    () => Math.min(ultimo, Math.max(0, Math.round(scrollX.get() / PASO))),
    (posicion, anterior) => {
      if (anterior !== null && posicion !== anterior) {
        scheduleOnRN(onCambio, posicion);
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
          {imagenes.map((imagen, indice) => (
            <Hueco
              key={indice}
              indice={indice}
              scrollX={scrollX}
              etiqueta={`Fondo ${indice + 1}`}
              onPress={centrar}
            >
              <Image source={imagen} contentFit="cover" style={styles.imagen} />
            </Hueco>
          ))}
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
  hueco: { width: PASO, alignItems: "center", justifyContent: "center" },
  imagen: { width: LADO, height: LADO, borderRadius: RADIO },
});
