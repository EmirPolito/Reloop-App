import { StyleSheet } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";

/**
 * Brillo de vidrio tipo lupa / gota sobre una foto circular.
 * Solo son capas blancas translúcidas con degradados suaves: no hay trazos ni bordes
 * duros (no se ve anillo) y la foto no se escala ni se deforma.
 * `id` debe ser distinto en cada avatar que esté en pantalla a la vez.
 */
export function BrilloAvatar({ id }: { id: string }) {
  const velo = `velo-${id}`;
  const lunaA = `lunaA-${id}`;
  const lunaB = `lunaB-${id}`;
  const reflejo = `reflejo-${id}`;
  const punto = `punto-${id}`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        {/* Velo de luz general, muy tenue, desde arriba a la izquierda */}
        <RadialGradient
          id={velo}
          cx="26"
          cy="22"
          r="75"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <Stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>

        {/* Media luna suave arriba a la izquierda:
            el centro está desplazado hacia la esquina opuesta, así solo el borde
            lejano (arriba-izquierda) recibe luz y se desvanece sin línea interior.
            Centro movido más abajo-derecha para que la luz suba hacia la esquina. */}
        <RadialGradient
          id={lunaA}
          cx="76"
          cy="80"
          r="82"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.72" stopColor="#fff" stopOpacity="0" />
          <Stop offset="0.88" stopColor="#fff" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.32" />
        </RadialGradient>

        {/* Destello de rebote abajo a la derecha, más tenue */}
        <RadialGradient
          id={lunaB}
          cx="26"
          cy="22"
          r="82"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0.78" stopColor="#fff" stopOpacity="0" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0.18" />
        </RadialGradient>

        {/* Reflejo en forma de gota, difuso */}
        <RadialGradient
          id={reflejo}
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <Stop offset="0.45" stopColor="#fff" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>

        {/* Puntito de brillo especular */}
        <RadialGradient
          id={punto}
          cx="0.5"
          cy="0.5"
          r="0.5"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Circle cx="50" cy="50" r="50" fill={`url(#${velo})`} />
      <Circle cx="50" cy="50" r="50" fill={`url(#${lunaA})`} />
      <Circle cx="50" cy="50" r="50" fill={`url(#${lunaB})`} />

      {/* Reflejo principal de gota, más arriba a la izquierda, siguiendo la curva */}
      <Ellipse
        cx="26"
        cy="19"
        rx="20"
        ry="9"
        fill={`url(#${reflejo})`}
        transform="rotate(-38 26 19)"
      />

      {/* Brillo especular pequeño */}
      <Ellipse
        cx="18"
        cy="26"
        rx="4"
        ry="2.2"
        fill={`url(#${punto})`}
        transform="rotate(-38 18 26)"
      />

      {/* Reflejo secundario pequeño abajo a la derecha */}
      <Ellipse
        cx="74"
        cy="80"
        rx="10"
        ry="3.5"
        fill={`url(#${reflejo})`}
        opacity={0.5}
        transform="rotate(-38 74 80)"
      />
    </Svg>
  );
}
