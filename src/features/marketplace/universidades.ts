/** Universidad a la que pertenece la comunidad de la app mientras no se elija otra */
export const UNIVERSIDAD_PROPIA = "utsv";

export interface Universidad {
  id: string;
  /** Siglas: lo que se muestra en el botón del inicio */
  sigla: string;
  nombre: string;
  /** Logo de la universidad (resultado de `require`); sin él se muestran sus siglas de 3 letras */
  logo?: number;
}

/**
 * Universidades que se pueden elegir en el inicio. Por ahora son de ejemplo: solo la propia
 * tiene publicaciones, y las demás se ven vacías hasta que existan comunidades ahí.
 */
export const UNIVERSIDADES: Universidad[] = [
  {
    id: UNIVERSIDAD_PROPIA,
    sigla: "UTSV",
    nombre: "Universidad Tecnológica del Sureste de Veracruz",
  },
  { id: "ugm", sigla: "UGM", nombre: "Universidad del Golfo de México" },
  { id: "uv", sigla: "UV", nombre: "Universidad Veracruzana" },
  {
    id: "itesco",
    sigla: "ITESCO",
    nombre: "Instituto Tecnológico Superior de Coatzacoalcos",
  },
];

export function universidadPorId(id: string): Universidad {
  return UNIVERSIDADES.find((u) => u.id === id) ?? UNIVERSIDADES[0];
}
