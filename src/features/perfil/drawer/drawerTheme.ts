import { Easing, LinearTransition } from "react-native-reanimated";
import { PERFIL_ICONS, type IconPerfilKey } from "../Perfiliconos";

/* ========================================================================== */
/*  DISEÑO: una sola fuente de verdad                                         */
/* ========================================================================== */

export type Modo = "claro" | "oscuro";

export const PELIGRO = "#EF4444";

export const TIPO = {
  titulo: 15,
  input: 13.5,
  descripcion: 12,
  contador: 12,
  ayuda: 12.5,
  boton: 15,
  error: 12,
  insignia: 11,
} as const;

export const PALETA = {
  claro: {
    sheet: "bg-[#ffffff]",
    campo: "#F2F2F2",
    tarjeta: "#F2F2F2",
    interna: "#E7E7E7",
    texto: "#101010",
    suave: "#A6A6A6",
    cursor: "#101010",
    activo: "#101010",
    sobreActivo: "#FFFFFF",
    inactivo: "#E7E7E7",
    cerrarFondo: "#F2F2F2",
    cerrarIcono: "#999999",
    cancelarFondo: "#E8EAF0",
    celdaActiva: "#FFFFFF",
    velo: "rgba(0,0,0,0.16)",
    veloConFoto: "rgba(0,0,0,0.30)",
  },
  oscuro: {
    sheet: "bg-[#0B1220]",
    campo: "#0E1727",
    tarjeta: "#17233A",
    interna: "#0E1727",
    texto: "#F8FAFC",
    suave: "#8996AB",
    cursor: "#F8FAFC",
    activo: "#0785FF",
    sobreActivo: "#FFFFFF",
    inactivo: "#22304A",
    cerrarFondo: "#17233A",
    cerrarIcono: "#8996AB",
    cancelarFondo: "#22304A",
    celdaActiva: "#FFFFFF",
    velo: "rgba(0,0,0,0.16)",
    veloConFoto: "rgba(0,0,0,0.30)",
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
