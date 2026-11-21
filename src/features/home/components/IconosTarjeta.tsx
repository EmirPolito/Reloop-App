import Svg, { G, Path } from "react-native-svg";

/** Iconos de la tarjeta de publicación del inicio (Iconly) */
interface IconoProps {
  size?: number;
  color?: string;
}

/**
 * Trazo extra sobre el contorno de la lupa: el trazo original mide 1.5 y con esto queda en
 * 1.8 (el trazo se reparte a los dos lados del borde).
 */
const GROSOR_EXTRA_LUPA = 0.25;

/** Lupa — Iconly Light Search */
export function IconoBusqueda({
  size = 24,
  color = "#000000",
  grosorExtra = GROSOR_EXTRA_LUPA,
}: IconoProps & {
  /** Trazo extra sobre el contorno (más alto = lupa más rellena) */
  grosorExtra?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.5254 3.46429C7.21107 3.46429 3.71448 6.96089 3.71448 11.2752C3.71448 15.5896 7.21107 19.0862 11.5254 19.0862C15.8389 19.0862 19.3364 15.5896 19.3364 11.2752C19.3364 6.96094 15.8389 3.46429 11.5254 3.46429ZM2.21448 11.2752C2.21448 6.13246 6.38264 1.96429 11.5254 1.96429C16.6672 1.96429 20.8364 6.13241 20.8364 11.2752C20.8364 16.4181 16.6672 20.5862 11.5254 20.5862C6.38264 20.5862 2.21448 16.418 2.21448 11.2752Z"
        fill={color}
        stroke={color}
        strokeWidth={grosorExtra}
        strokeLinejoin="round"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.149 19.2376C19.7838 19.2376 19.4875 19.5346 19.4875 19.8981C19.4875 20.2636 19.7838 20.5595 20.149 20.5595C20.5135 20.5595 20.8095 20.2642 20.8095 19.8981C20.8095 19.5339 20.5135 19.2376 20.149 19.2376ZM17.9875 19.8981C17.9875 18.7055 18.956 17.7376 20.149 17.7376C21.3426 17.7376 22.3095 18.7061 22.3095 19.8981C22.3095 21.092 21.3426 22.0595 20.149 22.0595C18.956 22.0595 17.9875 21.0927 17.9875 19.8981Z"
        fill={color}
        stroke={color}
        strokeWidth={grosorExtra}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Estrella rellena — Iconly Bold Star */
export function IconoEstrella({ size = 24, color = "#000000" }: IconoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="translate(1.999624, 2.5001)" fill={color}>
        <Path d="M15.9188758,11.82 C15.6598758,12.071 15.5408758,12.434 15.5998758,12.79 L16.4888758,17.71 C16.5638758,18.127 16.3878758,18.549 16.0388758,18.79 C15.6968758,19.04 15.2418758,19.07 14.8688758,18.87 L10.4398758,16.56 C10.2858758,16.478 10.1148758,16.434 9.93987581,16.429 L9.66887581,16.429 C9.57487581,16.443 9.48287581,16.473 9.39887581,16.519 L4.96887581,18.84 C4.74987581,18.95 4.50187581,18.989 4.25887581,18.95 C3.66687581,18.838 3.27187581,18.274 3.36887581,17.679 L4.25887581,12.759 C4.31787581,12.4 4.19887581,12.035 3.93987581,11.78 L0.32887581,8.28 C0.0268758104,7.987 -0.0781241896,7.547 0.0598758104,7.15 C0.19387581,6.754 0.53587581,6.465 0.94887581,6.4 L5.91887581,5.679 C6.29687581,5.64 6.62887581,5.41 6.79887581,5.07 L8.98887581,0.58 C9.04087581,0.48 9.10787581,0.388 9.18887581,0.31 L9.27887581,0.24 C9.32587581,0.188 9.37987581,0.145 9.43987581,0.11 L9.54887581,0.07 L9.71887581,5.32907052e-15 L10.1398758,5.32907052e-15 C10.5158758,0.039 10.8468758,0.264 11.0198758,0.6 L13.2388758,5.07 C13.3988758,5.397 13.7098758,5.624 14.0688758,5.679 L19.0388758,6.4 C19.4588758,6.46 19.8098758,6.75 19.9488758,7.15 C20.0798758,7.551 19.9668758,7.991 19.6588758,8.28 L15.9188758,11.82 Z" />
      </G>
    </Svg>
  );
}

/** Corazón de contorno (sin favorito) — Iconly Light Heart */
export function IconoCorazon({ size = 24, color = "#000000" }: IconoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.4999 9.63556C21.49 7.09969 20.1596 4.71489 17.5366 3.86991C15.7355 3.28869 13.7736 3.61191 12.25 5.79939C10.7264 3.61191 8.76447 3.28869 6.96339 3.86991C4.34014 4.71498 3.00971 7.10024 3.00008 9.63643C2.97582 14.6801 8.08662 18.5397 12.2487 20.3844L12.25 20.3838L12.2513 20.3844C16.4136 18.5396 21.5248 14.6797 21.4999 9.63556Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="square"
      />
    </Svg>
  );
}

/** Corazón relleno (favorito) — Iconly Bold Heart */
export function IconoCorazonRelleno({
  size = 24,
  color = "#000000",
}: IconoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.6911 3.3711C15.5951 2.6941 13.6841 3.2581 12.2501 4.9541C10.8151 3.2561 8.90409 2.6951 6.81009 3.3711C4.16309 4.2231 2.51209 6.6141 2.50009 9.6101C2.47609 14.7441 7.41709 18.7661 12.0481 20.8181L12.2511 20.9081L12.4541 20.8181C17.0861 18.7661 22.0251 14.7441 22.0001 9.6101C21.9881 6.6141 20.3371 4.2231 17.6911 3.3711Z"
        fill={color}
      />
    </Svg>
  );
}
