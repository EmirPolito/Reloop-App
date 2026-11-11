import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/features/shared/Text";
import type { FotoTomada } from "./CamaraCircular";
import { INTER, LADO_CIRCULO, coloresEditar } from "./editarTema";

const ZOOM_MAX = 4;
/** Zoom con el que empieza: deja margen para mover la foto en todas direcciones */
const ZOOM_INICIAL = 1.25;
/** Lado, en píxeles, de la foto de perfil que se guarda */
const LADO_FINAL = 800;

/**
 * Ajuste de la foto: se arrastra para moverla y se pellizca para hacer zoom. Solo se ve lo
 * que queda dentro del círculo, que es lo que se guarda.
 */
export function AjustarFoto({
  foto,
  isDark,
  textoSecundario,
  onSecundario,
  onGuardar,
}: {
  foto: FotoTomada;
  isDark: boolean;
  /** "Repetir" (cámara) o "Elegir otra" (galería) */
  textoSecundario: string;
  onSecundario: () => void;
  onGuardar: (uri: string) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const [guardando, setGuardando] = useState(false);

  // Medidas reales de la foto ya rotada: las que reporta la imagen al cargar. Las de la cámara
  // pueden venir sin aplicar la rotación (ancho y alto invertidos en Android).
  const [medidas, setMedidas] = useState({ width: foto.width, height: foto.height });

  // Tamaño base: la foto cubre el círculo justo (como "cover")
  const base = Math.max(LADO_CIRCULO / medidas.width, LADO_CIRCULO / medidas.height);
  const anchoBase = medidas.width * base;
  const altoBase = medidas.height * base;

  const zoom = useSharedValue(ZOOM_INICIAL);
  const zoomInicio = useSharedValue(ZOOM_INICIAL);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xInicio = useSharedValue(0);
  const yInicio = useSharedValue(0);

  /** La foto nunca deja huecos dentro del círculo */
  const limitar = (valor: number, tamano: number, z: number) => {
    "worklet";
    const max = Math.max(0, (tamano * z - LADO_CIRCULO) / 2);
    return Math.min(max, Math.max(-max, valor));
  };

  const mover = Gesture.Pan()
    .onStart(() => {
      xInicio.value = x.value;
      yInicio.value = y.value;
    })
    .onUpdate((e) => {
      x.value = limitar(xInicio.value + e.translationX, anchoBase, zoom.value);
      y.value = limitar(yInicio.value + e.translationY, altoBase, zoom.value);
    });

  const pellizcar = Gesture.Pinch()
    .onStart(() => {
      zoomInicio.value = zoom.value;
    })
    .onUpdate((e) => {
      zoom.value = Math.min(ZOOM_MAX, Math.max(1, zoomInicio.value * e.scale));
      x.value = limitar(x.value, anchoBase, zoom.value);
      y.value = limitar(y.value, altoBase, zoom.value);
    });

  // Doble toque: vuelve al encuadre inicial
  const reiniciar = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      zoom.value = withTiming(ZOOM_INICIAL, { duration: 220 });
      x.value = withTiming(0, { duration: 220 });
      y.value = withTiming(0, { duration: 220 });
    });

  const gestos = Gesture.Simultaneous(mover, pellizcar, reiniciar);

  const estiloFoto = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: zoom.value },
    ],
  }));

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      // Píxeles reales con los que trabaja el recorte (la foto ya rotada)
      const original = await ImageManipulator.ImageManipulator.manipulate(foto.uri).renderAsync();
      const W = original.width;
      const H = original.height;

      // Del círculo en pantalla a píxeles de la foto
      const escala = (base * zoom.value * medidas.width) / W;
      const lado = Math.min(LADO_CIRCULO / escala, W, H);
      const centroX = W / 2 - x.value / escala;
      const centroY = H / 2 - y.value / escala;
      const originX = Math.max(0, Math.min(W - lado, centroX - lado / 2));
      const originY = Math.max(0, Math.min(H - lado, centroY - lado / 2));

      const contexto = ImageManipulator.ImageManipulator.manipulate(foto.uri)
        .crop({ originX, originY, width: lado, height: lado })
        .resize({ width: Math.min(LADO_FINAL, Math.round(lado)) });
      const imagen = await contexto.renderAsync();
      const guardada = await imagen.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.85,
      });
      await onGuardar(guardada.uri);
    } catch (error) {
      console.warn("No se pudo recortar la foto.", error);
    } finally {
      setGuardando(false);
    }
  };

  const capaFoto = (
    <Animated.View style={[{ width: anchoBase, height: altoBase }, estiloFoto]}>
      <Image
        source={{ uri: foto.uri }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width > 0 && height > 0 && (width !== medidas.width || height !== medidas.height)) {
            setMedidas({ width, height });
          }
        }}
      />
    </Animated.View>
  );

  return (
    <View style={{ gap: 22 }}>
      <GestureDetector gesture={gestos}>
        <View style={styles.area}>
          <View style={[styles.circulo, styles.centro, { backgroundColor: c.avatarFondo }]}>
            {capaFoto}
          </View>
        </View>
      </GestureDetector>

      <Text style={[INTER.regular, { fontSize: 12.5, color: c.suave, textAlign: "center" }]}>
        Arrastra para mover · pellizca para hacer zoom
      </Text>

      <View style={styles.acciones}>
        <Pressable
          accessibilityRole="button"
          onPress={onSecundario}
          disabled={guardando}
          style={[styles.boton, { backgroundColor: isDark ? "#22304A" : "#EDEDED" }]}
        >
          <Text style={[INTER.medium, { fontSize: 14.5, color: c.texto }]}>
            {textoSecundario}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void guardar()}
          style={[styles.boton, { backgroundColor: isDark ? "#F1F5F9" : "#1C1C1E" }]}
        >
          {guardando ? (
            <ActivityIndicator color={isDark ? "#101010" : "#FFFFFF"} />
          ) : (
            <Text style={[INTER.medium, { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" }]}>
              Guardar
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    height: LADO_CIRCULO + 30,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: { alignItems: "center", justifyContent: "center" },
  circulo: {
    width: LADO_CIRCULO,
    height: LADO_CIRCULO,
    borderRadius: LADO_CIRCULO / 2,
    overflow: "hidden",
  },
  acciones: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  boton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
