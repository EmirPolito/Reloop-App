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

export const DESCRIPCION_POR_DEFECTO = "Nada que decir";

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
    gradientLight: ["#15a5ffff", "#3eb5ffff", "#9ad8ffff"],
    gradientDark: ["#1E3A8A", "#2563EB", "#38BDF8"],
    pillBg: "#f3fbffff",
    pillBorder: "#006eff2e",
  },
  naranja: {
    label: "Naranja",
    accent: "#ff7919ff",
    gradientLight: ["#ff8725ff", "#ff9d4cff", "#ffcea6ff"],
    gradientDark: ["#9A3412", "#EA580C", "#FB923C"],
    pillBg: "#fff9f5ff",
    pillBorder: "#ff6a0026",
  },
  rosa: {
    label: "Rosa",
    accent: "#EC4899",
    gradientLight: ["#ff208cff", "#ff3d9bff", "#ffacd4ff"],
    gradientDark: ["#9D174D", "#DB2777", "#F472B6"],
    pillBg: "#fff6fbff",
    pillBorder: "#ff00801c",
  },
  verde: {
    label: "Verde",
    accent: "#4ac88954",
    gradientLight: ["#2cb844ff", "#4ade80", "#a0ffc3ff"],
    gradientDark: ["#166534", "#16A34A", "#4ADE80"],
    pillBg: "#f5fffaff",
    pillBorder: "#59cf9454",
  },
  amarillo: {
    label: "Amarillo",
    accent: "#EAB308",
    gradientLight: ["#facc15", "#fde047", "#fff6afff"],
    gradientDark: ["#854D0E", "#CA8A04", "#FACC15"],
    pillBg: "#fffcf6ff", // Corregido de '1a' a 'ff'
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

/** Degradado del cielo en la cabecera del perfil (acompaña al scroll y no baja con él) */
export function gradienteCieloPerfil(
  color: ColorPerfil,
  isDark: boolean,
): [string, string, string] {
  const tema = TEMAS[color] ?? TEMAS.azul;
  return isDark ? tema.gradientDark : tema.gradientLight;
}

/** Puntos de parada del degradado: los 3 tonos del tema terminan un poco antes de la mitad de la pantalla (0.45) */
export const LOCATIONS_APP_BACKGROUND = [0, 0.12, 0.26, 0.45] as const;

/** Degradado de fondo de la app: color del tema elegido arriba y blanco/claro (#f8f8f8) al centro y abajo */
export function gradienteAppBackground(
  color: ColorPerfil,
  isDark: boolean,
): [string, string, string, string] {
  const tema = TEMAS[color] ?? TEMAS.azul;
  if (isDark) {
    return [
      tema.gradientDark[0],
      tema.gradientDark[1],
      tema.gradientDark[2],
      "#0F172A",
    ];
  }
  return [
    tema.gradientLight[0],
    tema.gradientLight[1],
    tema.gradientLight[2],
    "#f6f6f6ff",
  ];
}

/** Puntos de parada del degradado suave para los módulos generales:
 * El primer tono cubre toda la barra superior (donde va la hora) y luego se desvanece suavemente antes del 28 %
 */
export const LOCATIONS_MODULOS = [0, 0.06, 0.16, 0.28] as const;

/** Degradado más suave y compacto para los módulos generales (Inicio, Favoritos, Crear, Chats) */
export function gradienteSuaveModulos(
  color: ColorPerfil,
  isDark: boolean,
): [string, string, string, string] {
  const tema = TEMAS[color] ?? TEMAS.azul;
  if (isDark) {
    const [c0, c1] = tema.gradientDark;
    return [c0, c0, `${c1.slice(0, 7)}55`, "#0F172A"];
  }
  const [c0, c1] = tema.gradientLight;
  return [c0, c0, `${c1.slice(0, 7)}66`, "#f6f6f6ff"];
}

export interface EstiloBotonColor {
  colors: [string, string, string];
  borderColor: string;
  shadowColor: string;
}

export const ESTILOS_BOTON_COLOR: Record<ColorPerfil, EstiloBotonColor> = {
  azul: {
    colors: ["#72b4ffff", "#4fa1ffff", "#3493ffff"],
    borderColor: "#7ebaffff",
    shadowColor: "#2563EB",
  },
  naranja: {
    colors: ["#ffa047ff", "#ff8017ff", "#ea6300ff"],
    borderColor: "#ffba7eff",
    shadowColor: "#EA580C",
  },
  rosa: {
    colors: ["#ff60adff", "#ff2e94ff", "#e61579ff"],
    borderColor: "#ffa0d3ff",
    shadowColor: "#DB2777",
  },
  verde: {
    colors: ["#5ee2a0ff", "#2ec87aff", "#1db867ff"],
    borderColor: "#8af5bfff",
    shadowColor: "#059669",
  },
  amarillo: {
    colors: ["#fde047ff", "#eab308ff", "#ca8a04ff"],
    borderColor: "#fef08aff",
    shadowColor: "#CA8A04",
  },
};

/** Devuelve los tonos de degradado, borde y sombra adaptados al color de perfil para los botones de acción */
export function estiloBotonTema(color: ColorPerfil): EstiloBotonColor {
  return ESTILOS_BOTON_COLOR[color] ?? ESTILOS_BOTON_COLOR.azul;
}
