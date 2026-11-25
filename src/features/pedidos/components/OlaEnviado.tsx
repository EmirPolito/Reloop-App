import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT_CUBIC } from "@/constants/motion";
import { INTER } from "@/features/perfil/editar/editarTema";
import { Text } from "@/features/shared/Text";
import { AZUL_PEDIR, coloresPedido } from "../colores";

/** Arcoíris suave del borde de la ola */
const ARCOIRIS = [
  "#FF6B8B",
  "#FFB86B",
  "#FFE66B",
  "#6BF2A5",
  "#11A8FF",
  "#A98BFF",
] as const;
/** Grosor del borde de luz y de su resplandor (a escala completa) */
const BORDE = 26;
const RESPLANDOR = 70;
const DURACION = 1300;
/** Lo que se queda "Pedido enviado" en pantalla antes de ir al chat */
const ESPERA = 1600;
const CURVA_OLA = Easing.bezier(0.45, 0, 0.2, 1);

/**
 * La ola de "Enviar": nace en el centro del botón (`origen`) y crece como un círculo con borde
 * de luz arcoíris hasta cubrir el drawer, y deja ver "Pedido enviado". Al terminar llama a
 * `onFin`. Con "reducir movimiento" no hay ola: aparece directo.
 */
export function OlaEnviado({
  ancho,
  alto,
  origen,
  fondo,
  isDark,
  onFin,
}: {
  ancho: number;
  alto: number;
  origen: { x: number; y: number };
  /** Color de la card del drawer: lo que cubre la ola */
  fondo: string;
  isDark: boolean;
  onFin: () => void;
}) {
  const c = coloresPedido(isDark);
  const reducir = useReducedMotion();
  const progreso = useSharedValue(reducir ? 1 : 0);
  // Hasta la esquina más lejana: a escala 1 la ola cubre todo
  const radio = Math.max(
    Math.hypot(origen.x, origen.y),
    Math.hypot(ancho - origen.x, origen.y),
    Math.hypot(origen.x, alto - origen.y),
    Math.hypot(ancho - origen.x, alto - origen.y),
  );

  useEffect(() => {
    progreso.set(
      withTiming(1, { duration: reducir ? 0 : DURACION, easing: CURVA_OLA }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    const t = setTimeout(onFin, (reducir ? 0 : DURACION) + ESPERA);
    return () => clearTimeout(t);
    // Una sola vez al montarse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escala = useAnimatedStyle(() => ({
    transform: [{ scale: progreso.get() }],
  }));
  // El arcoíris se apaga al final: no queda rastro en los bordes
  const luz = useAnimatedStyle(() => ({
    transform: [{ scale: progreso.get() }],
    opacity: interpolate(progreso.get(), [0, 0.15, 0.8, 1], [0, 1, 0.9, 0]),
  }));

  // El resplandor, más tenue que el borde
  const resplandor = useAnimatedStyle(() => ({
    transform: [{ scale: progreso.get() }],
    opacity:
      0.35 * interpolate(progreso.get(), [0, 0.15, 0.8, 1], [0, 1, 0.9, 0]),
  }));

  const circulo = (r: number) => ({
    position: "absolute" as const,
    left: origen.x - r,
    top: origen.y - r,
    width: r * 2,
    height: r * 2,
    borderRadius: r,
    overflow: "hidden" as const,
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="none"
        style={[circulo(radio + RESPLANDOR), resplandor]}
      >
        <LinearGradient
          colors={ARCOIRIS}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[circulo(radio + BORDE), luz]}>
        <LinearGradient
          colors={ARCOIRIS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        style={[circulo(radio), escala, { backgroundColor: fondo }]}
      />

      <View
        accessibilityLiveRegion="polite"
        accessibilityLabel="Pedido enviado"
        style={[StyleSheet.absoluteFill, styles.centro]}
      >
        <Animated.View
          entering={ZoomIn.delay(reducir ? 0 : DURACION * 0.55)
            .duration(260)
            .easing(EASE_OUT_CUBIC)}
          style={styles.palomita}
        >
          <Ionicons name="checkmark" size={34} color="#FFFFFF" />
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(reducir ? 0 : DURACION * 0.7).duration(220)}
          style={styles.textos}
        >
          <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
            Pedido enviado
          </Text>
          <Text style={[INTER.regular, styles.nota, { color: c.suave }]}>
            Abriendo el chat con el vendedor…
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const LADO_PALOMITA = 64;

const styles = StyleSheet.create({
  centro: { alignItems: "center", justifyContent: "center", gap: 14 },
  palomita: {
    width: LADO_PALOMITA,
    height: LADO_PALOMITA,
    borderRadius: LADO_PALOMITA / 2,
    backgroundColor: AZUL_PEDIR,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { alignItems: "center", gap: 4 },
  titulo: { fontSize: 18 },
  nota: { fontSize: 13.5 },
});
