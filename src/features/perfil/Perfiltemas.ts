/* -------------------------------------------------------------------------- */
/*  Tipos y límites del perfil editable                                       */
/* -------------------------------------------------------------------------- */

export type ColorPerfil = "azul" | "naranja" | "rosa" | "verde" | "amarillo";

export interface PildoraPerfilData {
  id: string;
  text: string;
  color: ColorPerfil;
  /** Clave del icono (ej. "work", "game", "calendar", etc.) */
  icon?: string;
}

/** Todo lo que el usuario puede personalizar desde el drawer */
export interface DatosPerfil {
  photo: string | null;
  name: string;
  description: string;
  /** Color del fondo del header */
  color: ColorPerfil;
  /** Máximo MAX_PILDORAS */
  pills: PildoraPerfilData[];
  /** ids de los stickers (ver perfilStickers.ts), en el orden en que se colocan. Máximo MAX_STICKERS */
  stickers: string[];
}

export const MAX_PILDORAS = 4;
export const MAX_STICKERS = 4;
export const MAX_NOMBRE = 30;
export const MAX_DESCRIPCION = 80;
export const MAX_TEXTO_PILDORA = 16;

export const DESCRIPCION_POR_DEFECTO = "Miembro de Reloop";

/* -------------------------------------------------------------------------- */
/*  Colores                                                                   */
/* -------------------------------------------------------------------------- */

export interface TemaColor {
  label: string;
  /** Color sólido (círculos, iconos) */
  accent: string;
  /** Degradado del header: 3 tonos de arriba hacia abajo */
  gradientLight: [string, string, string];
  gradientDark: [string, string, string];
  /** Píldora: fondo suave y borde más notorio */
  pillBg: string;
  pillBorder: string;
}

export const COLORES_PERFIL: ColorPerfil[] = [
  "azul",
  "naranja",
  "rosa",
  "verde",
  "amarillo",
];

export const TEMAS: Record<ColorPerfil, TemaColor> = {
  azul: {
    label: "Azul",
    accent: "#0EA5E9",
    gradientLight: ["#2ab4ff", "#41bdff", "#78d0ff"],
    gradientDark: ["#1E3A8A", "#2563EB", "#38BDF8"],
    pillBg: "#f3fbffff",
    pillBorder: "#006eff2e",
  },
  naranja: {
    label: "Naranja",
    accent: "#ff7919ff",
    gradientLight: ["#ff8d2fff", "#ffb16dff", "#ffbb7fff"],
    gradientDark: ["#9A3412", "#EA580C", "#FB923C"],
    pillBg: "#fff9f5ff",
    pillBorder: "#ff6a003e",
  },
  rosa: {
    label: "Rosa",
    accent: "#EC4899",
    gradientLight: ["#ff4fa3", "#ff74b8", "#ffa3cf"],
    gradientDark: ["#9D174D", "#DB2777", "#F472B6"],
    pillBg: "#fff6fbff",
    pillBorder: "#ff008028",
  },
  verde: {
    label: "Verde",
    accent: "#4ac88954",
    gradientLight: ["#22c55e", "#4ade80", "#86efac"],
    gradientDark: ["#166534", "#16A34A", "#4ADE80"],
    pillBg: "#f5fffaff",
    pillBorder: "#59cf9454",
  },
  amarillo: {
    label: "Amarillo",
    accent: "#EAB308",
    gradientLight: ["#facc15", "#fde047", "#fef08a"],
    gradientDark: ["#854D0E", "#CA8A04", "#FACC15"],
    pillBg: "#fffcf61a",
    pillBorder: "#eab2083d",
  },
};

/** Colores del header: 3 del tema y un cuarto transparente, para que se funda con el fondo de la app */
export function gradienteHeader(
  color: ColorPerfil,
  isDark: boolean,
): [string, string, string, string] {
  const tema = TEMAS[color] ?? TEMAS.azul;
  const [a, b, c] = isDark ? tema.gradientDark : tema.gradientLight;
  // Mismo color que el tercero, sin opacidad (#rrggbb + 00): así el fundido no se ensucia al mezclar
  return [a, b, c, `${c.slice(0, 7)}00`];
}
