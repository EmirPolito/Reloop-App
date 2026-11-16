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
  /** Avatar orbe elegido (índice de `ORBES`); se muestra cuando no hay foto */
  orb: number | null;
  /** Imagen de fondo (portada) detrás de la foto de perfil */
  cover: string | null;
  name: string;
  /**
   * @username único, sin "@" y en minúsculas; `null` mientras no tiene (cuentas anteriores).
   * Solo lo cambia `claimUsername` (reserva en `usernames`): guardar el perfil no lo escribe.
   */
  username: string | null;
  description: string;
  /** Color del fondo del header */
  color: ColorPerfil;
  /** Máximo MAX_PILDORAS */
  pills: PildoraPerfilData[];
  /** Ya no se muestran; se conserva porque las reglas de Firestore exigen la lista */
  stickers: string[];
  /**
   * Cuenta nueva que aún no termina la configuración inicial (onboarding). Las fichas
   * anteriores a esta función no lo tienen y nunca lo ven. Guardar el perfil no lo escribe.
   */
  onboardingPendiente: boolean;
}

export const MAX_PILDORAS = 2;
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
  /** Píldora: fondo suave y color para texto e icono */
  pillBg: string;
  pillBgDark: string;
  pillColor: string;
  pillColorDark: string;
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
    accent: "#5c5c5cff",
    gradientLight: ["#15a5ffff", "#3eb5ffff", "#9ad8ffff"],
    gradientDark: ["#1E3A8A", "#2563EB", "#38BDF8"],
    pillBg: "#237bb510",
    pillBgDark: "rgba(56, 189, 248, 0.14)",
    pillColor: "#1c90dedd",
    pillColorDark: "#38BDF8",
    pillBorder: "transparent",
  },
  naranja: {
    label: "Naranja",
    accent: "#5c5c5cff",
    gradientLight: ["#ff8725ff", "#ff9d4cff", "#ffcea6ff"],
    gradientDark: ["#9A3412", "#EA580C", "#FB923C"],
    pillBg: "#cb6d2017",
    pillBgDark: "rgba(251, 146, 60, 0.14)",
    pillColor: "#e47418e0",
    pillColorDark: "#FB923C",
    pillBorder: "transparent",
  },
  rosa: {
    label: "Rosa",
    accent: "#5c5c5cff",
    gradientLight: ["#ff208cff", "#ff3d9bff", "#ffacd4ff"],
    gradientDark: ["#9D174D", "#DB2777", "#F472B6"],
    pillBg: "#b1296812",
    pillBgDark: "rgba(244, 114, 182, 0.14)",
    pillColor: "#df1c77dc",
    pillColorDark: "#F472B6",
    pillBorder: "transparent",
  },
  verde: {
    label: "Verde",
    accent: "#5c5c5cff",
    gradientLight: ["#2cb844ff", "#4ade80", "#a0ffc3ff"],
    gradientDark: ["#166534", "#16A34A", "#4ADE80"],
    pillBg: "#29b0611a",
    pillBgDark: "rgba(74, 222, 128, 0.14)",
    pillColor: "#30955ae2",
    pillColorDark: "#4ADE80",
    pillBorder: "transparent",
  },
  amarillo: {
    label: "Amarillo",
    accent: "#5c5c5cff",
    gradientLight: ["#facc15", "#fde047", "#fff6afff"],
    gradientDark: ["#854D0E", "#CA8A04", "#FACC15"],
    pillBg: "#c7a21e13",
    pillBgDark: "rgba(250, 204, 21, 0.14)",
    pillColor: "#e0b519de",
    pillColorDark: "#FACC15",
    pillBorder: "transparent",
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

/** Botón de acción principal (crear publicación, enviar mensaje): un solo estilo fijo */
export const ESTILO_BOTON_ACCION = {
  colors: ["#72b4ffff", "#4fa1ffff", "#3493ffff"] as [string, string, string],
  borderColor: "#7ebaffff",
  shadowColor: "#2563EB",
};
