/** Frases que rotan en el input vacío del inicio (se cambian solo aquí) */
export const FRASES_BUSQUEDA = [
  "Buscar productos",
  "Buscar @usuario",
  "Buscar lo que necesites",
] as const;

/** Texto fijo cuando el sistema pide reducir el movimiento */
export const FRASE_BUSQUEDA_FIJA = "Buscar productos o @usuario";

/** Lo que oye el lector de pantalla (el texto que rota es decorativo) */
export const ETIQUETA_BUSQUEDA = "Buscar productos o usuarios con @";
export const PISTA_BUSQUEDA =
  "Escribe @ al inicio para buscar personas por su usuario";

/** Ideas de qué buscar, en píldoras debajo del buscador del módulo de búsqueda */
export const SUGERENCIAS_BUSQUEDA = [
  "Libros",
  "Calculadora",
  "Laptop",
  "Uniformes",
  "Postres",
  "Audífonos",
] as const;

/** Ideas con descripción, en la lista del módulo de búsqueda vacío; `busqueda` es lo que se escribe */
export const IDEAS_BUSQUEDA = [
  {
    busqueda: "libro",
    titulo: "Libros y apuntes",
    detalle: "De semestres anteriores, más baratos",
  },
  {
    busqueda: "bata",
    titulo: "Bata de laboratorio",
    detalle: "Para tus prácticas",
  },
  {
    busqueda: "calculadora",
    titulo: "Calculadora científica",
    detalle: "Para exámenes y tareas",
  },
  {
    busqueda: "comida",
    titulo: "Comida casera",
    detalle: "Hecha por la comunidad",
  },
  {
    busqueda: "gato",
    titulo: "Adopta una mascota",
    detalle: "Gatos y perros que buscan hogar",
  },
  {
    busqueda: "@",
    titulo: "Buscar personas",
    detalle: "Escribe @ y su usuario",
  },
] as const;
