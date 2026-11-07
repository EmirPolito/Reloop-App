import { useEventListener } from "expo";
import * as SplashScreen from "expo-splash-screen";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";

/** Tiempo máximo de espera por si el decodificador del dispositivo se congela. */
const SAFETY_TIMEOUT_MS = 20000;
const FADE_OUT_MS = 400;

/**
 * Video de introducción a pantalla completa. Se cierra solo al terminar, al fallar,
 * al tocarlo o tras el tiempo de seguridad, con un desvanecido hacia la app.
 */
export function IntroVideoSplash() {
  const [visible, setVisible] = useState(true);
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const finishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishSplash = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Desvanecimiento suave hacia la app; al terminar se desmonta el video
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [fadeAnim]);

  // Temporizador de seguridad
  useEffect(() => {
    timerRef.current = setTimeout(finishSplash, SAFETY_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [finishSplash]);

  // La splash nativa se oculta cuando el video ya tiene dónde dibujarse
  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Tap opcional para saltar la introducción */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Omitir introducción"
        onPress={finishSplash}
        style={styles.fill}
      >
        <View onLayout={hideNativeSplash} style={styles.overlay}>
          <IntroVideo onDone={finishSplash} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * El player y el VideoView viven en el mismo componente, así que se
 * montan y se liberan juntos (evita "shared object already released").
 */
function IntroVideo({ onDone }: { onDone: () => void }) {
  const player = useVideoPlayer(
    require("@/assets/videos/introduccion-vid.mp4"),
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = Platform.OS === "web";
      videoPlayer.play();
    },
  );

  // Se dispara cuando el video termina por completo
  useEventListener(player, "playToEnd", onDone);

  // Si hay error de reproducción, pasar de inmediato
  useEventListener(player, "statusChange", ({ status, error }) => {
    if (status === "error") {
      console.warn("No se pudo reproducir el video de introducción.", error);
      onDone();
    }
  });

  return (
    <VideoView
      player={player}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
      style={styles.fill}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
});
