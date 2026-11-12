import { StyleSheet } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

/**
 * Brillo de vidrio sobre una foto circular, sin borde marcado: luz suave arriba a la izquierda
 * que sigue la curva, destello tenue abajo a la derecha y un velo de luz que aclara la imagen
 * (sin oscurecerla).
 * `id` debe ser distinto en cada avatar que esté en pantalla a la vez.
 */
export function BrilloAvatar({ id }: { id: string }) {
  const arco = `arco-${id}`;
  const destello = `destello-${id}`;
  const luz = `luz-${id}`;
  const reflejo = `reflejo-${id}`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        {/* Máxima luz en el punto del borde más cercano a la esquina; se apaga hacia los lados */}
        <SvgLinearGradient id={arco} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0.12" stopColor="#fff" stopOpacity="1" />
          <Stop offset="0.3" stopColor="#fff" stopOpacity="0.4" />
          <Stop offset="0.44" stopColor="#fff" stopOpacity="0" />
        </SvgLinearGradient>

        {/* Lo mismo en la esquina opuesta, más tenue */}
        <SvgLinearGradient id={destello} x1="1" y1="1" x2="0" y2="0">
          <Stop offset="0.14" stopColor="#fff" stopOpacity="0.9" />
          <Stop offset="0.3" stopColor="#fff" stopOpacity="0.3" />
          <Stop offset="0.42" stopColor="#fff" stopOpacity="0" />
        </SvgLinearGradient>

        {/* Aclarado general desde arriba a la izquierda */}
        <RadialGradient
          id={luz}
          cx="28"
          cy="24"
          r="70"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <Stop offset="0.4" stopColor="#fff" stopOpacity="0.07" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.02" />
        </RadialGradient>

        {/* Reflejo difuminado en forma de gota */}
        <RadialGradient
          id={reflejo}
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <Stop offset="0.5" stopColor="#fff" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Circle cx="50" cy="50" r="50" fill={`url(#${luz})`} />

      {/* Arco de luz arriba a la izquierda: tres trazos, del más ancho y tenue al más fino y fuerte */}
      <Circle
        cx="50"
        cy="50"
        r="46.5"
        fill="none"
        stroke={`url(#${arco})`}
        strokeWidth="7"
        opacity={0.14}
      />
      <Circle
        cx="50"
        cy="50"
        r="47.5"
        fill="none"
        stroke={`url(#${arco})`}
        strokeWidth="4"
        opacity={0.28}
      />

      {/* Destello abajo a la derecha */}
      <Circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke={`url(#${destello})`}
        strokeWidth="4"
        opacity={0.2}
      />

      <Ellipse
        cx="30"
        cy="24"
        rx="22"
        ry="10"
        fill={`url(#${reflejo})`}
        transform="rotate(-38 30 24)"
      />
    </Svg>
  );
}
