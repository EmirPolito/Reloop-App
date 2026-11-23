import { Easing, LinearTransition } from "react-native-reanimated";
import { PERFIL_ICONS, type IconPerfilKey } from "../iconosPerfil";

/* ========================================================================== */
/*  DISEÑO: una sola fuente de verdad                                         */
/* ========================================================================== */

export type Modo = "claro" | "oscuro";

export const PELIGRO = "#EF4444";

export const TIPO = {
  input: 13.5,
} as const;

export const PALETA = {
  claro: {
    campo: "#F2F2F2",
    tarjeta: "#F2F2F2",
    texto: "#101010",
    suave: "#A6A6A6",
    cursor: "#101010",
    activo: "#101010",
    sobreActivo: "#FFFFFF",
    cerrarFondo: "#F2F2F2",
  },
  // Neutros, sin el azul de antes: campos y tarjetas como las del perfil, y los botones un
  // poco más claros
  oscuro: {
    campo: "rgba(255,255,255,0.05)",
    tarjeta: "rgba(255,255,255,0.05)",
    texto: "#F8FAFC",
    suave: "#8996AB",
    cursor: "#F8FAFC",
    activo: "#0785FF",
    sobreActivo: "#FFFFFF",
    cerrarFondo: "rgba(255,255,255,0.1)",
  },
} as const;

export const ICONOS_ELEGIBLES = Object.keys(PERFIL_ICONS) as IconPerfilKey[];
export const TINTE_ICONO = 0.22;

/* Movimiento */
export const DURACION = 180;
export const EASE = Easing.out(Easing.cubic);
export const LAYOUT = LinearTransition.duration(DURACION).easing(EASE);

export const FUENTE_INPUT = { fontFamily: "Poppins_400Regular" } as const;

/* -------------------------------- Utilidades -------------------------------- */

/** #RRGGBB + opacidad (0-1) -> #RRGGBBAA */
export const conAlfa = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const al = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${h.slice(0, 6)}${al}`;
};

export const nuevoId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
