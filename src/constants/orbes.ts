/** Colores de un avatar orbe: del borde iluminado (claro) al núcleo (profundo). */
export interface ColoresOrbe {
  nombre: string;
  claro: string;
  medio: string;
  profundo: string;
  /** Color de la inicial, con buen contraste sobre el centro del orbe */
  texto: string;
}

/** Los 10 avatares predeterminados. El perfil guarda el índice (0–9). */
export const ORBES: readonly ColoresOrbe[] = [
  {
    nombre: "Azul",
    claro: "#BFF0F7",
    medio: "#6FA8FF",
    profundo: "#4A55F2",
    texto: "#FFFFFF",
  },
  {
    nombre: "Violeta",
    claro: "#E8CBFA",
    medio: "#BB5BDD",
    profundo: "#A12A9C",
    texto: "#FFFFFF",
  },
  {
    nombre: "Coral",
    claro: "#FDCBBE",
    medio: "#F8856C",
    profundo: "#EE4128",
    texto: "#FFFFFF",
  },
  {
    nombre: "Verde",
    claro: "#CFF8D6",
    medio: "#5CD58B",
    profundo: "#12915F",
    texto: "#FFFFFF",
  },
  {
    nombre: "Ámbar",
    claro: "#FFF0BD",
    medio: "#FFC553",
    profundo: "#F28A1C",
    texto: "#5A2E00",
  },
  {
    nombre: "Rosa",
    claro: "#FFD8E8",
    medio: "#FF86BA",
    profundo: "#E52E7C",
    texto: "#FFFFFF",
  },
  {
    nombre: "Turquesa",
    claro: "#CBF7F2",
    medio: "#4FD5CE",
    profundo: "#0B8F9C",
    texto: "#FFFFFF",
  },
  {
    nombre: "Índigo",
    claro: "#D8DBFF",
    medio: "#8188F8",
    profundo: "#3D35C6",
    texto: "#FFFFFF",
  },
  {
    nombre: "Grafito",
    claro: "#E9ECF2",
    medio: "#9BA4B4",
    profundo: "#475061",
    texto: "#FFFFFF",
  },
  {
    nombre: "Lima",
    claro: "#F0FBC2",
    medio: "#B8E250",
    profundo: "#5C9F14",
    texto: "#2B4700",
  },
];

/** `true` si el valor es el índice de un orbe que existe. */
export function isOrb(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < ORBES.length
  );
}
