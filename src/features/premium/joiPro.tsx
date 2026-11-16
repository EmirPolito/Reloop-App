/**
 * JoiPro – React Native / Expo port
 *
 * Adapts the web component to React Native:
 *  - Canvas dust particles  → custom <Animated.View> dots via requestAnimationFrame
 *  - CSS gradient background → expo-linear-gradient
 *  - motion/react whileTap  → Animated.spring scale on Pressable
 *  - CSS clipPath           → borderRadius
 *  - CSS shine on ::after   → Animated overlay with LinearGradient
 */

import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

// ---------------------------------------------------------------------------
// Pure-logic helpers (ported directly from joipro-motion.ts)
// ---------------------------------------------------------------------------

const SHINE_SPEED = 55.2;
const SHINE_WIDTH = 34;
const SHINE_SKEW = -18;
const SHINE_RUNWAY = 53;
const SHINE_PHASE = 1.6;

function shinePeriod(pillWidth: number) {
  return (pillWidth + SHINE_RUNWAY * 2) / SHINE_SPEED;
}

function shineOffset(time: number, pillWidth: number) {
  const period = shinePeriod(pillWidth);
  const phase = (((time + SHINE_PHASE) % period) + period) % period;
  return -SHINE_RUNWAY + phase * SHINE_SPEED;
}

const PARTICLE_LIFE = 0.7;
const PARTICLE_PEAK = 0.55;
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
// SVG Icons (react-native-svg)
// ---------------------------------------------------------------------------

function SparklesIcon({
  size = 24,
  color = "rgba(255,255,255,0.77)",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19 13.5a1 1 0 0 1 .986.836l.148.886.032.156a2 2 0 0 0 1.612 1.488l.886.148a1 1 0 0 1 0 1.972l-.886.148a2 2 0 0 0-1.644 1.644l-.148.886a1 1 0 0 1-1.972 0l-.148-.886a2 2 0 0 0-1.488-1.612l-.156-.032-.886-.148a1 1 0 0 1 0-1.972l.886-.148.156-.032a2 2 0 0 0 1.488-1.612l.148-.886.018-.089A1 1 0 0 1 19 13.5M10 1a1 1 0 0 1 1 1 7 7 0 0 0 7 7 1 1 0 0 1 .86.491l.019.032A1 1 0 0 1 19 10a1 1 0 0 1-.999 1A7.01 7.01 0 0 0 11 18.001a1 1 0 0 1-.229.635A1 1 0 0 1 10 19l-.001-.001V19A1 1 0 0 1 9 18a7 7 0 0 0-7-7 1 1 0 1 1 0-2 7 7 0 0 0 7-7 1 1 0 0 1 1-1" />
    </Svg>
  );
}

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
// Dust particles overlay (renders View dots instead of canvas)
// ---------------------------------------------------------------------------

type ParticleDotProps = { particle: Particle };

function ParticleDot({ particle }: ParticleDotProps) {
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
// Shine overlay
// ---------------------------------------------------------------------------

function ShineOverlay({
  time,
  buttonWidth,
}: {
  time: number;
  buttonWidth: number;
}) {
  const offset = shineOffset(time, buttonWidth);
  const shineHalf = (SHINE_WIDTH / 2) * Math.cos((SHINE_SKEW * Math.PI) / 180);

  if (offset + shineHalf <= 0 || offset - shineHalf >= buttonWidth) {
    return null;
  }

  const start = Math.max(0, Math.min(0.98, (offset - shineHalf) / buttonWidth));
  const mid = Math.max(start + 0.01, Math.min(0.99, offset / buttonWidth));
  const end = Math.max(
    mid + 0.01,
    Math.min(1, (offset + shineHalf) / buttonWidth),
  );

  return (
    <LinearGradient
      colors={[
        "rgba(255,255,255,0)",
        "rgba(255,255,255,0.9)",
        "rgba(255,255,255,0)",
      ]}
      locations={[start, mid, end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type JoiProProps = {
  title?: string;
  subtitle?: string;
  /** Label of the upgrade button. */
  action?: string;
  onUpgrade?: () => void;
  /** Animated highlight running along the button's rim. */
  shine?: boolean;
  /** Rising dust particles. A number sets how many are in the air at once. */
  particles?: boolean | number;
  /** Playback rate of the internal clock. */
  speed?: number;
  /** Pass a manual time (seconds) to pause or scrub the animation. */
  time?: number;
  style?: ViewStyle;
};

export function JoiPro({
  title = "Reloop premium",
  subtitle = "Subscription or one-time purchase",
  action = "Upgrade",
  onUpgrade,
  shine = true,
  particles = true,
  speed = 1,
  time,
  style,
}: JoiProProps) {
  // Layout measurements
  const [bannerSize, setBannerSize] = useState({ width: 0, height: 0 });
  const [buttonWidth, setButtonWidth] = useState(0);

  // Animation clock (state-driven without accessing refs during render)
  const [clockTime, setClockTime] = useState(time ?? 0);
  const rateRef = useRef(speed);

  // Button press scale
  const [scale] = useState(() => new Animated.Value(1));
  const [bannerScale] = useState(() => new Animated.Value(1));

  // Sync speed
  useEffect(() => {
    rateRef.current = speed;
  }, [speed]);

  // Auto-clock
  useEffect(() => {
    if (time !== undefined) return;
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
  }, [time]);

  const activeTime = time !== undefined ? time : clockTime;

  const onBannerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBannerSize({ width, height });
  }, []);

  const onButtonLayout = useCallback((e: LayoutChangeEvent) => {
    setButtonWidth(e.nativeEvent.layout.width);
  }, []);

  // Particle count
  const particleCount =
    particles === false ? 0 : particles === true ? undefined : particles;

  const currentParticles =
    bannerSize.width > 0 && bannerSize.height > 0 && particles
      ? particlesAt(
          activeTime,
          bannerSize.width,
          bannerSize.height,
          particleCount,
        )
      : [];

  // Press handlers
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
    <Animated.View style={[{ transform: [{ scale: bannerScale }] }, style]}>
      <LinearGradient
        colors={["#2075fd", "#00aafe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.banner, { minHeight: 104, borderRadius: 28 }]}
        onLayout={onBannerLayout}
      >
        {/* Dust particles */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {currentParticles.map((p, i) => (
            <ParticleDot key={i} particle={p} />
          ))}
        </View>

        {/* Main pressable content */}
        <Pressable
          onPress={onUpgrade}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.card}
          accessibilityLabel={`${title}: ${action}`}
          accessibilityRole="button"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <SparklesIcon size={32} />
          </View>

          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Upgrade button */}
          <Pressable
            onPress={onUpgrade}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onLayout={onButtonLayout}
            style={styles.buttonOuter}
            accessibilityRole="button"
            accessibilityLabel={action}
          >
            <Animated.View style={[styles.button, { transform: [{ scale }] }]}>
              {/* Button rim */}
              <View
                style={[StyleSheet.absoluteFill, styles.buttonRim]}
                pointerEvents="none"
              />

              {/* Shine overlay */}
              {shine && buttonWidth > 0 && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { borderRadius: 18, overflow: "hidden" },
                  ]}
                  pointerEvents="none"
                >
                  <ShineOverlay time={activeTime} buttonWidth={buttonWidth} />
                </View>
              )}

              <ArrowCircleUpIcon size={24} />
              <Text style={styles.buttonLabel}>{action}</Text>
            </Animated.View>
          </Pressable>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    overflow: "hidden",
  },
  card: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    alignContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingStart: 68,
    gap: 16,
  },
  iconContainer: {
    position: "absolute",
    start: 20,
    top: "50%",
    marginTop: -16, // half of 32px icon
  },
  textBlock: {
    flex: 1,
    minWidth: 120,
    gap: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.24,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.55)",
  },
  buttonOuter: {
    flexShrink: 1,
    minWidth: 0,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    paddingVertical: 6,
    paddingStart: 6,
    paddingEnd: 10,
    minHeight: 36,
    overflow: "hidden",
  },
  buttonRim: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
    color: "#fff",
    flexShrink: 1,
  },
});
