import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ImageSourcePropType,
  View,
  useWindowDimensions,
} from "react-native";

interface Props {
  source: ImageSourcePropType;
  isDark: boolean;
  /** Posición Y donde termina el borde inferior de las nubes */
  bottomY: number;
}

/** Proporción de la imagen: 1024 x 1536 */
const PROPORCION = 1520 / 1020;

/** Cuánto más ancha que la pantalla se dibuja la imagen (1 = justo al ancho, mayor = más escondidas a los lados) */
const ESCALA_ANCHO = 1.25;

/** Alto del degradado inferior que funde las nubes con el fondo */
const ALTO_FUNDIDO = 110;

/** Nubes decorativas (PNG transparente), abiertas hacia los lados. No tocan el color del degradado de arriba */
export function NubesPerfil({ source, isDark, bottomY }: Props) {
  const { width } = useWindowDimensions();

  const ancho = width * ESCALA_ANCHO;
  const alto = width * PROPORCION;
  const izquierda = -(ancho - width) / 2;

  // Mismo color del fondo de la pantalla; el tramo transparente usa el mismo tono (+00)
  const fondo = isDark ? "#0F172A" : "#f8f8f8";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: bottomY - alto,
        left: izquierda,
        width: ancho,
        height: alto,
      }}
    >
      <Image
        source={source}
        resizeMode="stretch"
        style={{ width: ancho, height: alto, opacity: isDark ? 0.35 : 1 }}
      />

      {/* Degradado inferior: de transparente al color del fondo */}
      <LinearGradient
        colors={[`${fondo}00`, fondo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: ALTO_FUNDIDO,
        }}
      />
    </View>
  );
}
