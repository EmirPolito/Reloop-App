import { createContext, useContext, useEffect, useId } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/** Forma festoneada de la insignia (viewBox 22×22) */
const FORMA =
  "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z";

export const DORADO_PREMIUM = "#E2A41C";

/** Barrido del brillo: dura ~0.5 s y descansa ~1.5 s entre pasadas */
const BARRIDO_MS = 500;
const PAUSA_MS = 1500;
/** La franja recorre la insignia de lado a lado (en unidades del viewBox, con margen) */
const INICIO = -12;
const FIN = 26;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Una pantalla con scroll pone aquí `1` mientras se desplaza: el brillo se detiene (cada
 * cuadro del barrido actualiza el SVG) y vuelve a empezar cuando termina el movimiento.
 */
export const PausaBrilloContext = createContext<SharedValue<number> | null>(
  null,
);

/** Un barrido de la franja y su descanso, en bucle */
function barrido() {
  "worklet";
  return withRepeat(
    withSequence(
      withTiming(FIN, {
        duration: BARRIDO_MS,
        easing: Easing.inOut(Easing.quad),
      }),
      // Vuelve al inicio sin verse (está fuera de la forma) y espera
      withDelay(PAUSA_MS, withTiming(INICIO, { duration: 0 })),
    ),
    -1,
  );
}

/**
 * Insignia Premium: festoneada, dorada, con palomita blanca y un brillo que la cruza en
 * diagonal cada pocos segundos, recortado a su forma. Con "reducir movimiento" (o
 * `variant="static"`) queda quieta. Alrededor lleva un resplandor dorado muy suave.
 * Se dibuja dentro de un cuadro de `size`: no cambia el tamaño de lo que la rodea.
 */
export function PremiumBadge({
  size,
  color = DORADO_PREMIUM,
  variant = "shimmer",
  accessibilityLabel = "Cuenta Premium",
  style,
}: {
  size: number;
  color?: string;
  variant?: "shimmer" | "static";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const anima = variant === "shimmer" && !reduceMotion;
  const x = useSharedValue(INICIO);
  const desplazando = useContext(PausaBrilloContext);

  useEffect(() => {
    if (!anima) {
      x.set(INICIO);
      return;
    }
    x.set(barrido());
    return () => cancelAnimation(x);
  }, [anima, x]);

  // Mientras la pantalla se desplaza el brillo se detiene; al parar, vuelve a empezar
  useAnimatedReaction(
    () => (desplazando ? desplazando.get() : 0),
    (actual, anterior) => {
      if (!anima || anterior === null) return;
      if (actual === 1) {
        cancelAnimation(x);
        x.set(INICIO);
      } else if (anterior === 1) {
        x.set(barrido());
      }
    },
    [anima],
  );

  const franja = useAnimatedProps(() => ({ x: x.get() }));
  // Ids propios por instancia: dos insignias de distinto color no comparten degradados
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const halo = `insignia-halo-${id}`;
  const relleno = `insignia-relleno-${id}`;
  const brillo = `insignia-brillo-${id}`;
  const forma = `insignia-forma-${id}`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="-2 -2 26 26">
        <Defs>
          {/* Resplandor: halo dorado que se desvanece hacia afuera */}
          <RadialGradient
            id={halo}
            cx="11"
            cy="11"
            r="13"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.55" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
          {/* Relieve: un poco más claro arriba que abajo */}
          <LinearGradient id={relleno} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.08" />
          </LinearGradient>
          {/* Franja de luz: blanca semitransparente con los bordes suaves */}
          <LinearGradient id={brillo} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <ClipPath id={forma}>
            <Path d={FORMA} />
          </ClipPath>
        </Defs>

        <Rect x="-2" y="-2" width="26" height="26" fill={`url(#${halo})`} />
        <Path d={FORMA} fill={color} />
        <Path d={FORMA} fill={`url(#${relleno})`} />

        {anima ? (
          <G clipPath={`url(#${forma})`}>
            {/* Inclinada 15° respecto a la vertical (~105°) */}
            <G transform="rotate(15 11 11)">
              <AnimatedRect
                animatedProps={franja}
                y="-6"
                width="6"
                height="34"
                fill={`url(#${brillo})`}
              />
            </G>
          </G>
        ) : null}

        {/* Palomita (viewBox 24×24) a la mitad del tamaño de la insignia */}
        <G transform="translate(5.5 5.5) scale(0.4583)">
          <Polyline
            points="5 12.5 10 17.5 19 7.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </View>
  );
}
