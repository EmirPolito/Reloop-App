import * as SplashScreen from "expo-splash-screen";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

// preventAutoHideAsync() ya se llama en app/_layout.tsx; aquí solo se oculta (hideAsync).

/**
 * Una sola imagen basta: el logo es un contorno con el interior transparente. Al hacer zoom
 * hacia el centro del cuerpo, el aro sale de la pantalla por los bordes mientras el fondo
 * se desvanece, así que se "atraviesa" el logo hacia la app.
 */
const LOGO = require("../../../assets/logos-intro/logo-negro2.png");

/** Logo con el nombre ("reloop"), justo debajo del icono. */
const LOGO_NOMBRE = require("../../../assets/images/logos-reloop/logoo.png");
const LOGO_NOMBRE_ASPECTO = 1774 / 887; // ancho / alto del PNG
const LOGO_NOMBRE_ANCHO_MAX = 220; // dp
const LOGO_NOMBRE_SEPARACION = -4; // dp entre el icono y el nombre

/** Cuánto sube el icono respecto al centro de la pantalla (dp). */
const SUBIR_ICONO = 40;

/* ------------------------------------------------------------------ */
/* Geometría del PNG (px del lienzo original)                         */
/* ------------------------------------------------------------------ */
const CANVAS_W = 1245;
const CANVAS_H = 1260;
// Centro y radio interior del cuerpo del logo: el zoom se ancla ahí, de modo que el aro
// del cuerpo es lo que acaba saliendo por los bordes de la pantalla.
const ORIGIN_X = 620;
const ORIGIN_Y = 680;
const SAFE_RADIUS = 330;

/* ------------------------------------------------------------------ */
/* Ajustes                                                            */
/* ------------------------------------------------------------------ */
const FONDO = "#f8f8f8ff";
const LOGO_WIDTH = 150; // ancho en dp del isotipo
const INTRO_FROM = 0.82;
const ANTICIPATION = 0.92; // pequeño "encogimiento" antes de entrar
const INTRO_MS = 800;
const HOLD_MS = 1200;
const ANTICIPATE_MS = 240;
const EXPAND_MS = 1100;

const SALIDA_SUAVE = Easing.out(Easing.cubic);

// La animación se ve una vez por arranque de la app: si el árbol raíz se vuelve a montar
// en la misma sesión (p. ej. recarga en caliente), no se repite.
let hasPlayed = false;
const oyentesFin = new Set<() => void>();

/**
 * `true` cuando la animación de entrada ya terminó (o ya se vio en este arranque). Sirve
 * para presentar algo encima de la app sin que quede debajo de la animación (onboarding).
 */
export function useIntroTerminada(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      oyentesFin.add(avisar);
      return () => oyentesFin.delete(avisar);
    },
    () => hasPlayed,
  );
}

type Props = {
  children: ReactNode;
  /** false mientras se resuelve la sesión: la salida espera a que sea true. */
  isAppReady?: boolean;
};

/**
 * Animación de entrada sobre toda la app. La app se monta debajo desde el principio, así
 * que al terminar ya está en la pantalla que le corresponde según la sesión.
 */
export function AnimatedSplash({ children, isAppReady = true }: Props) {
  const [showOverlay, setShowOverlay] = useState(!hasPlayed);

  const handleFinish = () => {
    hasPlayed = true;
    setShowOverlay(false);
    oyentesFin.forEach((avisar) => avisar());
  };

  return (
    <View style={styles.root}>
      {children}
      {showOverlay && (
        <SplashOverlay isAppReady={isAppReady} onFinish={handleFinish} />
      )}
    </View>
  );
}

function SplashOverlay({
  isAppReady,
  onFinish,
}: {
  isAppReady: boolean;
  onFinish: () => void;
}) {
  const { width: winW, height: winH } = useWindowDimensions();

  const k = LOGO_WIDTH / CANVAS_W;
  const logoW = LOGO_WIDTH;
  const logoH = CANVAS_H * k;
  // Nombre: 50 % del ancho de la pantalla, sin pasar del máximo
  const nombreW = Math.min(winW * 0.5, LOGO_NOMBRE_ANCHO_MAX);
  const nombreH = nombreW / LOGO_NOMBRE_ASPECTO;

  const dx = (ORIGIN_X - CANVAS_W / 2) * k; // punto fijo del zoom respecto al centro
  const dy = (ORIGIN_Y - CANVAS_H / 2) * k;
  const safeR = SAFE_RADIUS * k;
  // El icono está SUBIR_ICONO más arriba del centro: su punto de zoom queda más lejos del borde inferior
  const farthest = Math.hypot(
    winW / 2 + Math.abs(dx),
    winH / 2 + SUBIR_ICONO + Math.abs(dy),
  );
  // Escala final: el hueco del cuerpo queda más grande que la diagonal de la pantalla
  const maxExpand = (farthest * 1.15) / (safeR * ANTICIPATION);

  const intro = useSharedValue(0);
  const anticipate = useSharedValue(0);
  const expand = useSharedValue(0);

  const [ready, setReady] = useState({
    logoLoaded: false,
    nombreLoaded: false,
    laidOut: false,
  });
  const [introDone, setIntroDone] = useState(false);

  // Si la imagen falla no se bloquea la app: se omite la animación
  const onImageError = () => {
    SplashScreen.hideAsync().catch(() => {});
    onFinish();
  };

  // 1) Con la imagen cargada y la vista medida: se oculta la splash nativa y empieza la entrada
  useEffect(() => {
    // Espera a las dos imágenes para que el icono y el nombre entren a la vez
    if (!ready.logoLoaded || !ready.nombreLoaded || !ready.laidOut) return;
    let cancelled = false;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        intro.set(
          withTiming(1, { duration: INTRO_MS, easing: SALIDA_SUAVE }, (ok) => {
            if (ok) scheduleOnRN(setIntroDone, true);
          }),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [ready, intro]);

  // 2) Terminada la entrada y resuelta la sesión: pausa, anticipación y zoom hacia la app
  useEffect(() => {
    if (!introDone || !isAppReady) return;
    anticipate.set(
      withDelay(
        HOLD_MS,
        withTiming(
          1,
          { duration: ANTICIPATE_MS, easing: Easing.out(Easing.quad) },
          (ok) => {
            if (!ok) return;
            expand.set(
              withTiming(
                1,
                { duration: EXPAND_MS, easing: Easing.bezier(0.7, 0, 0.3, 1) },
                (done) => {
                  if (done) scheduleOnRN(onFinish);
                },
              ),
            );
          },
        ),
      ),
    );
  }, [introDone, isAppReady, anticipate, expand, onFinish]);

  // Escala anclada en (dx, dy), interpolada en espacio logarítmico para que la velocidad
  // percibida del zoom sea constante, sin acelerones al final.
  const stageStyle = useAnimatedStyle(() => {
    const base =
      interpolate(intro.get(), [0, 1], [INTRO_FROM, 1]) *
      interpolate(anticipate.get(), [0, 1], [1, ANTICIPATION]);
    const s = base * Math.exp(Math.log(maxExpand) * expand.get());
    return {
      opacity:
        interpolate(intro.get(), [0, 0.6], [0, 1], Extrapolation.CLAMP) *
        interpolate(expand.get(), [0.55, 0.9], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: dx * (1 - s) },
        { translateY: dy * (1 - s) },
        { scale: s },
      ],
    };
  });

  // El fondo se desvanece mientras se atraviesa el logo: la app aparece dentro del aro
  const fondoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expand.get(),
      [0.15, 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  // El nombre entra igual que el icono (fundido + crece de INTRO_FROM a 1)
  // y se va junto con el fondo (no hace zoom)
  const nombreStyle = useAnimatedStyle(() => ({
    opacity:
      interpolate(intro.get(), [0, 0.6], [0, 1], Extrapolation.CLAMP) *
      interpolate(expand.get(), [0, 0.4], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(intro.get(), [0, 1], [INTRO_FROM, 1]) }],
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={() => setReady((r) => ({ ...r, laidOut: true }))}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.fondo, fondoStyle]}
      />

      <View style={styles.center}>
        <Animated.View style={[{ width: logoW, height: logoH }, stageStyle]}>
          <Image
            source={LOGO}
            style={{ width: logoW, height: logoH }}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setReady((r) => ({ ...r, logoLoaded: true }))}
            onError={onImageError}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.nombre,
          { top: winH / 2 - SUBIR_ICONO + logoH / 2 + LOGO_NOMBRE_SEPARACION },
          nombreStyle,
        ]}
      >
        <Image
          source={LOGO_NOMBRE}
          style={{ width: nombreW, height: nombreH }}
          resizeMode="contain"
          fadeDuration={0}
          accessibilityLabel="ReLoop"
          onLoad={() => setReady((r) => ({ ...r, nombreLoaded: true }))}
          onError={onImageError}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    // Centra el icono SUBIR_ICONO por encima de la mitad de la pantalla
    paddingBottom: SUBIR_ICONO * 2,
  },
  nombre: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fondo: { backgroundColor: FONDO },
});
