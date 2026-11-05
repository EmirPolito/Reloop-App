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

  const player = useVideoPlayer(
    require("@/assets/videos/introduccion-vid.mp4"),
    (videoPlayer) => {
      videoPlayer.loop = false;
      videoPlayer.muted = Platform.OS === "web";
      videoPlayer.play();
    },
  );

  const finishSplash = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    try {
      player.pause();
    } catch {
      // Ignorar error de pausa
    }
    // Desvanecimiento suave (fade out) hacia la app
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [player, fadeAnim]);

  // Se dispara automáticamente cuando el video termina de reproducirse por completo
  useEventListener(player, "playToEnd", finishSplash);

  // Si ocurre un error de reproducción, pasar de inmediato
  useEventListener(player, "statusChange", ({ status, error }) => {
    if (status === "error") {
      console.warn("No se pudo reproducir el video de introducción.", error);
      finishSplash();
    }
  });

  useEffect(() => {
    const timer = setTimeout(finishSplash, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [finishSplash]);

  // La splash nativa se oculta cuando el video ya tiene dónde dibujarse
  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    // Tap/clic opcional para saltar si el usuario no desea esperar
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Omitir introducción"
        onPress={finishSplash}
        style={StyleSheet.absoluteFill}
      >
        <View onLayout={hideNativeSplash} style={styles.overlay}>
          <VideoView
            player={player}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            style={styles.video}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000",
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
});
