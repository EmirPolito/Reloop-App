/**
 * TarjetaPremium – Banner animado de ReLoop Premium.
 *
 * Layout:
 *  - Izquierda: título, descripción y botón (en columna).
 *  - Derecha: insignia de verificación propia (festoneada).
 *
 * Mismo gradiente azul para activo y no activo.
 * La insignia es estática (sin brillo animado).
 */

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Defs,
  G,
  Path,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
  Text as SvgText,
} from "react-native-svg";

// ---------------------------------------------------------------------------
// Helpers de animación
// ---------------------------------------------------------------------------

const PARTICLE_LIFE = 2.8;
const PARTICLE_PEAK = 0.7;
const PARTICLE_INSET = 16;
const PARTICLE_DENSITY =
  46 / ((394 - PARTICLE_INSET * 2) * (104 - PARTICLE_INSET * 2));
const PARTICLE_SPEED_MIN = 3;
const PARTICLE_SPEED_RANGE = 7.8;
const PARTICLE_RADIUS_MIN = 0.45;
const PARTICLE_RADIUS_RANGE = 0.7;
const PARTICLE_MAX = 1000;

type Particle = { x: number; y: number; radius: number; alpha: number };

function hash(index: number, channel: number) {
  let value =
    Math.imul(index ^ 0x9e3779b9, 0x85ebca6b) ^
    Math.imul(channel + 1, 0xc2b2ae35);
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

function particlesAt(
  time: number,
  width: number,
  height: number,
  count?: number,
): Particle[] {
  const spanX = width - PARTICLE_INSET * 2;
  const spanY = height - PARTICLE_INSET * 2;
  if (spanX <= 0 || spanY <= 0) return [];
  const rate =
    count === undefined
      ? PARTICLE_DENSITY * spanX * spanY
      : Math.min(count, PARTICLE_MAX) / PARTICLE_LIFE;
  if (!(rate > 0)) return [];
  const particles: Particle[] = [];
  const first = Math.floor((time - PARTICLE_LIFE) * rate) - 1;
  const last = Math.floor(time * rate);
  for (let index = first; index <= last; index += 1) {
    const age = time - (index + hash(index, 0)) / rate;
    if (age < 0 || age >= PARTICLE_LIFE) continue;
    const progress = age / PARTICLE_LIFE;
    particles.push({
      x: PARTICLE_INSET + hash(index, 1) * spanX,
      y:
        PARTICLE_INSET +
        hash(index, 2) * spanY -
        (PARTICLE_SPEED_MIN + hash(index, 3) * PARTICLE_SPEED_RANGE) * age,
      radius:
        (PARTICLE_RADIUS_MIN + hash(index, 4) * PARTICLE_RADIUS_RANGE) *
        (1 - progress / 2),
      alpha:
        progress < PARTICLE_PEAK
          ? progress / PARTICLE_PEAK
          : (1 - progress) / (1 - PARTICLE_PEAK),
    });
  }
  return particles;
}

// ---------------------------------------------------------------------------
// Icono flecha (botón)
// ---------------------------------------------------------------------------

function ArrowCircleUpIcon({
  size = 24,
  color = "#fff",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 1c6.075 0 11 4.925 11 11s-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1m.707 5.793a1 1 0 0 0-1.414 0l-4.5 4.5-.068.076a1 1 0 0 0 1.406 1.406l.076-.068L11 9.914V16.5a1 1 0 1 0 2 0V9.914l2.793 2.793a1 1 0 1 0 1.414-1.414z" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Insignia de verificación (independiente)
// ---------------------------------------------------------------------------

/** Forma festoneada (viewBox 22×22) */
const FORMA_INSIGNIA =
  "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z";

function InsigniaVerificacion({
  size,
  activa,
  checkColor = "#00a5f8ff",
}: {
  size: number;
  activa: boolean;
  checkColor?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const halo = `tp-halo-${id}`;
  const relleno = `tp-relleno-${id}`;

  return (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={size} height={size} viewBox="-2 -2 26 26">
        <Defs>
          {/* Resplandor blanco suave alrededor */}
          <RadialGradient
            id={halo}
            cx="11"
            cy="11"
            r="12.5"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          {/* Relieve sutil: blanco arriba, azul muy tenue abajo */}
          <SvgLinearGradient id={relleno} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#F0F7FF" />
          </SvgLinearGradient>
        </Defs>

        <Rect x="-2" y="-2" width="26" height="26" fill={`url(#${halo})`} />

        {/* Sombra muy sutil en la base para no exagerar el efecto alzado */}
        <G transform="translate(0 0.25)">
          <Path d={FORMA_INSIGNIA} fill="rgba(0,40,130,0.14)" />
        </G>

        <Path d={FORMA_INSIGNIA} fill={`url(#${relleno})`} />

        {activa ? (
          /* Palomita (Premium activo) */
          <G transform="translate(5.5 5.5) scale(0.4583)">
            <Polyline
              points="5 12.5 10 17.5 19 7.5"
              fill="none"
              stroke={checkColor}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        ) : (
          /* Precio $69 (Sin Premium) */
          <SvgText
            x="11"
            y="13.3"
            fill={checkColor}
            fontFamily="Inter_700Bold"
            fontSize="6.5"
            letterSpacing="-0.3"
            textAnchor="middle"
          >
            $69
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Partícula de polvo
// ---------------------------------------------------------------------------

function ParticleDot({ particle }: { particle: Particle }) {
  return (
    <View
      style={{
        position: "absolute",
        left: particle.x - particle.radius,
        top: particle.y - particle.radius,
        width: particle.radius * 2,
        height: particle.radius * 2,
        borderRadius: particle.radius,
        backgroundColor: `rgba(255,255,255,${particle.alpha.toFixed(3)})`,
      }}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

const GRADIENTE_BANNER: [string, string] = ["#2075fd", "#00aafe"];
/** La insignia ocupa casi todo el alto del banner (usa también el padding), con tope */
const INSIGNIA_PROPORCION = 0.95;
const INSIGNIA_MIN = 76;
const INSIGNIA_MAX = 107;

export function TarjetaPremium({
  activa,
  onPress,
}: {
  activa: boolean;
  isDark: boolean;
  onPress: () => void;
}) {
  const titulo = activa ? "Premium activo" : "ReLoop Premium";
  const detalle = activa
    ? "Eres miembro de Reloop Premium."
    : "Destaca con beneficios exclusivos.";
  const accionLabel = activa ? "Mis beneficios" : "Suscribirme";

  // Layout
  const [bannerSize, setBannerSize] = useState({ width: 0, height: 0 });

  // Reloj de animación
  const [clockTime, setClockTime] = useState(0);
  const rateRef = useRef(1);

  // Escalas para press
  const [scale] = useState(() => new Animated.Value(1));
  const [bannerScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let frameId: number;
    let previous = performance.now();

    const animate = (now: number) => {
      const delta = Math.min(0.1, (now - previous) / 1000) * rateRef.current;
      previous = now;
      setClockTime((prev) => prev + delta);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const onBannerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBannerSize({ width, height });
  }, []);

  const tamanoInsignia = Math.round(
    Math.min(
      INSIGNIA_MAX,
      Math.max(INSIGNIA_MIN, bannerSize.height * INSIGNIA_PROPORCION),
    ),
  );

  const currentParticles =
    bannerSize.width > 0 && bannerSize.height > 0
      ? particlesAt(clockTime, bannerSize.width, bannerSize.height)
      : [];

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1.05,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
    Animated.timing(bannerScale, {
      toValue: 0.97,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scale, bannerScale]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
    Animated.timing(bannerScale, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scale, bannerScale]);

  return (
    <Animated.View style={{ transform: [{ scale: bannerScale }] }}>
      <LinearGradient
        colors={GRADIENTE_BANNER}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
        onLayout={onBannerLayout}
      >
        {/* Partículas */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {currentParticles.map((p, i) => (
            <ParticleDot key={i} particle={p} />
          ))}
        </View>

        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.card}
          accessibilityLabel={
            activa ? `${titulo}. ${detalle}` : `${titulo}, $69. ${detalle}`
          }
          accessibilityRole="button"
        >
          {/* Columna izquierda: título, descripción, botón */}
          <View style={styles.leftColumn}>
            <Text style={styles.title}>{titulo}</Text>
            <Text numberOfLines={2} style={styles.subtitle}>
              {detalle}
            </Text>

            <View style={styles.buttonOuter}>
              <Animated.View
                style={[styles.button, { transform: [{ scale }] }]}
              >
                <View
                  style={[StyleSheet.absoluteFill, styles.buttonRim]}
                  pointerEvents="none"
                />
                <ArrowCircleUpIcon size={19} />
                <Text style={styles.buttonLabel}>{accionLabel}</Text>
              </Animated.View>
            </View>
          </View>

          {/* Derecha: insignia */}
          <View style={styles.badgeWrap}>
            <InsigniaVerificacion size={tamanoInsignia} activa={activa} />
          </View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
    minHeight: 105,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingStart: 18,
    paddingEnd: 0,
    gap: 10,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    lineHeight: 22,
    color: "#fff",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    marginTop: 1.5,
    fontSize: 12.68,
    lineHeight: 16,
    color: "rgba(255,255,255,0.85)",
  },
  buttonOuter: {
    marginTop: 11.5,
    alignSelf: "flex-start",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 14,
    minHeight: 30,
    minWidth: 125,
    overflow: "hidden",
  },
  buttonRim: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  buttonLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: "#fff",
  },
  badgeWrap: {
    flexShrink: 0,
    // Se extiende sobre el padding: crece sin hacer más alta la card
    marginVertical: -11,
    marginEnd: -2,
    alignItems: "center",
    justifyContent: "center",
  },
});
