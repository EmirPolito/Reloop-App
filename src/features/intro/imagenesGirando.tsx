import { Image } from "expo-image";
import { useMemo, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

export interface ItemRuedaOrbital {
  id: string;
  /** URL remota o require(...) */
  image: string | number;
  alt?: string;
}

export interface PropsRuedaOrbital {
  items: ItemRuedaOrbital[];
  /** Radio del círculo en px. */
  radius?: number;
  /** Diámetro de cada burbuja en px. */
  itemSize?: number;
  autoRotate?: boolean;
  /** Grados por segundo (negativo = sentido contrario). */
  autoRotateSpeed?: number;
  /** Inclina cada burbuja hacia afuera, como rueda de la fortuna. */
  faceOutward?: boolean;
  /** Permite girar la rueda con el dedo. */
  draggable?: boolean;
  /** Qué tan rápido frena la inercia (mayor = frena antes). */
  friction?: number;
  /** Contenido centrado dentro del círculo. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* ---------- Brillo de vidrio / gota de agua (SVG) ---------- */

function BrilloVidrio({ id }: { id: string }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        {/* Aro de luz en el borde */}
        <RadialGradient
          id={`rim-${id}`}
          cx="50"
          cy="50"
          r="50"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.78" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.93" stopColor="#fff" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.45" />
        </RadialGradient>

        {/* Sombra suave abajo (profundidad) */}
        <SvgLinearGradient id={`shade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </SvgLinearGradient>

        {/* Luz en el borde inferior (cáustica) */}
        <RadialGradient
          id={`caustic-${id}`}
          cx="55"
          cy="96"
          r="38"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>

        {/* Brillo general suave arriba a la izquierda */}
        <RadialGradient
          id={`sheen-${id}`}
          cx="30"
          cy="22"
          r="62"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.2" />
          <Stop offset="0.35" stopColor="#fff" stopOpacity="0.1" />
          <Stop offset="0.7" stopColor="#fff" stopOpacity="0.03" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>

        {/* Reflejo difuminado: se desvanece por completo hacia el borde */}
        <RadialGradient
          id={`gloss-${id}`}
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="1" />
          <Stop offset="0.4" stopColor="#fff" stopOpacity="0.20" />
          <Stop offset="0.75" stopColor="#fff" stopOpacity="0.07" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect width="100" height="100" fill={`url(#shade-${id})`} />
      <Rect width="100" height="100" fill={`url(#sheen-${id})`} />
      <Rect width="100" height="100" fill={`url(#caustic-${id})`} />
      <Circle cx="50" cy="50" r="50" fill={`url(#rim-${id})`} />

      {/* Reflejo tipo gota arriba, grande y difuminado */}
      <Ellipse
        cx="44"
        cy="22"
        rx="36"
        ry="17"
        fill={`url(#gloss-${id})`}
        transform="rotate(-14 44 22)"
      />

      {/* Punto de luz pequeño abajo a la derecha */}
      <Ellipse cx="73" cy="76" rx="5" ry="3" fill="#fff" opacity={0.2} />
    </Svg>
  );
}

/* ---------- Burbuja ---------- */

type PropsItem = {
  item: ItemRuedaOrbital;
  index: number;
  step: number;
  radius: number;
  itemSize: number;
  center: number;
  faceOutward: boolean;
  rotation: SharedValue<number>;
};

function ItemRueda({
  item,
  index,
  step,
  radius,
  itemSize,
  center,
  faceOutward,
  rotation,
}: PropsItem) {
  const animatedStyle = useAnimatedStyle(() => {
    const angle = (index * step + rotation.value) % 360;
    const rad = (angle * Math.PI) / 180;
    return {
      transform: [
        { translateX: radius * Math.sin(rad) },
        { translateY: -radius * Math.cos(rad) },
        { rotate: faceOutward ? `${angle}deg` : "0deg" },
      ],
    };
  });

  const source =
    typeof item.image === "string" ? { uri: item.image } : item.image;

  const radioCirculo = itemSize / 2;

  return (
    // Capa exterior: posición + sombra (en iOS la sombra se pierde con overflow hidden)
    <Animated.View
      className="absolute"
      style={[
        {
          width: itemSize,
          height: itemSize,
          borderRadius: radioCirculo,
          left: center - itemSize / 2,
          top: center - itemSize / 2,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
        animatedStyle,
      ]}
    >
      {/* Marco: borde blanco 85% + recorte circular */}
      <View
        className="flex-1 overflow-hidden"
        style={{ borderRadius: radioCirculo }}
      >
        <Image
          source={source}
          accessibilityLabel={item.alt}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          transition={200}
        />
        <BrilloVidrio id={item.id} />
      </View>
    </Animated.View>
  );
}

/* ---------- Rueda ---------- */

const MAX_VELOCIDAD = 900; // grados por segundo

export default function RuedaOrbitalImagenes({
  items,
  radius = 245,
  itemSize = 105,
  autoRotate = true,
  autoRotateSpeed = 8,
  faceOutward = false,
  draggable = true,
  friction = 2.2,
  children,
  style,
}: PropsRuedaOrbital) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const velocity = useSharedValue(0); // inercia en grados/s
  const dragging = useSharedValue(false);
  const lastTouchAngle = useSharedValue(0);

  const step = items.length > 0 ? 360 / items.length : 0;
  const diameter = radius * 2 + itemSize;
  const center = diameter / 2;

  useFrameCallback((frame) => {
    if (dragging.value) return;
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16, 64) / 1000;
    const auto = autoRotate && !reduceMotion ? autoRotateSpeed : 0;

    let next = (rotation.value + (velocity.value + auto) * dt) % 360;
    if (next < 0) next += 360;
    rotation.value = next;

    // La inercia se apaga suavemente y queda solo el giro automático
    velocity.value *= Math.exp(-friction * dt);
    if (Math.abs(velocity.value) < 0.5) velocity.value = 0;
  });

  const gesto = useMemo(
    () =>
      Gesture.Pan()
        .enabled(draggable)
        .onBegin((e) => {
          "worklet";
          dragging.value = true;
          velocity.value = 0;
          lastTouchAngle.value =
            (Math.atan2(e.x - center, -(e.y - center)) * 180) / Math.PI;
        })
        .onUpdate((e) => {
          "worklet";
          const actual =
            (Math.atan2(e.x - center, -(e.y - center)) * 180) / Math.PI;
          let delta = actual - lastTouchAngle.value;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          lastTouchAngle.value = actual;

          let next = (rotation.value + delta) % 360;
          if (next < 0) next += 360;
          rotation.value = next;
        })
        .onEnd((e) => {
          "worklet";
          // Velocidad angular = (r × v) / |r|²  (positivo = sentido horario)
          const rx = e.x - center;
          const ry = e.y - center;
          const r2 = rx * rx + ry * ry;
          if (r2 < 400) {
            velocity.value = 0;
            return;
          }
          const w =
            ((rx * e.velocityY - ry * e.velocityX) / r2) * (180 / Math.PI);
          velocity.value = Math.max(-MAX_VELOCIDAD, Math.min(MAX_VELOCIDAD, w));
        })
        .onFinalize(() => {
          "worklet";
          dragging.value = false;
        }),
    [center, draggable, dragging, lastTouchAngle, rotation, velocity],
  );

  return (
    <GestureDetector gesture={gesto}>
      <View
        accessibilityRole="image"
        accessibilityLabel="Rueda orbital de imágenes"
        style={[{ width: diameter, height: diameter }, style]}
      >
        {children ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
          >
            {children}
          </View>
        ) : null}

        {items.map((item, index) => (
          <ItemRueda
            key={item.id}
            item={item}
            index={index}
            step={step}
            radius={radius}
            itemSize={itemSize}
            center={center}
            faceOutward={faceOutward}
            rotation={rotation}
          />
        ))}
      </View>
    </GestureDetector>
  );
}
