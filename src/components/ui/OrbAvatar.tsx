import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { ORBES } from "@/constants/orbes";
import { Text } from "@/features/shared/Text";
import { getInitials } from "@/utils/text";

/**
 * Avatar predeterminado: una esfera pastel con un núcleo de color concentrado abajo a la
 * derecha, luz suave arriba a la izquierda y un aro luminoso en el borde, con la inicial
 * de la persona al centro.
 * Es un SVG estático: no anima nada por sí mismo, así que se puede escalar o mover desde
 * fuera sin costo.
 */
export function OrbAvatar({
  orb,
  name,
  size,
  style,
}: {
  /** Índice en `ORBES` (0–9) */
  orb: number;
  name: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colores = ORBES[orb] ?? ORBES[0];
  // Los degradados de un mismo orbe son idénticos: compartir el id entre instancias es inocuo
  const base = `orbe-base-${orb}`;
  const luz = `orbe-luz-${orb}`;
  const borde = `orbe-borde-${orb}`;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Avatar ${colores.nombre} de ${name}`}
      style={[styles.orbe, { width: size, height: size }, style]}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {/* Núcleo: color profundo abajo a la derecha que se funde pronto en pastel */}
          <RadialGradient
            id={base}
            cx="60"
            cy="68"
            r="62"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={colores.profundo} />
            <Stop offset="0.42" stopColor={colores.medio} />
            <Stop offset="0.88" stopColor={colores.claro} />
            <Stop offset="1" stopColor={colores.claro} />
          </RadialGradient>
          {/* Luz suave arriba a la izquierda */}
          <RadialGradient
            id={luz}
            cx="28"
            cy="22"
            r="46"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#fff" stopOpacity="0.6" />
            <Stop offset="0.5" stopColor="#fff" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
          {/* Aro luminoso en el borde */}
          <RadialGradient
            id={borde}
            cx="50"
            cy="50"
            r="50"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0.72" stopColor="#fff" stopOpacity="0" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0.38" />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${base})`} />
        <Circle cx="50" cy="50" r="50" fill={`url(#${luz})`} />
        <Circle cx="50" cy="50" r="50" fill={`url(#${borde})`} />
      </Svg>

      <Text
        allowFontScaling={false}
        style={[styles.inicial, { fontSize: size * 0.4, color: colores.texto }]}
      >
        {getInitials(name).charAt(0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  orbe: { alignItems: "center", justifyContent: "center" },
  inicial: { fontFamily: "Inter_600SemiBold", includeFontPadding: false },
});
