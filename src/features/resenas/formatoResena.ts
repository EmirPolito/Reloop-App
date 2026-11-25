/**
 * Reseñas de venta y comida: las escribe quien compró, cuando el vendedor se lo pide en el
 * chat. Lógica pura (sin React ni Firebase): tiene pruebas en `tests/domain.test.ts`.
 */

export const LARGO_RESENA = 300;

/** Una palabra por estrella, de 1 a 5 */
export const ETIQUETAS_ESTRELLAS = [
  "Malo",
  "Regular",
  "Bien",
  "Muy bien",
  "Excelente",
] as const;

export function etiquetaEstrellas(valor: number): string {
  return valor >= 1 && valor <= 5
    ? ETIQUETAS_ESTRELLAS[Math.round(valor) - 1]
    : "Sin calificar";
}

export interface Resena {
  /** uid de quien la escribió (también es el id del documento: una por persona) */
  autorId: string;
  autor: string;
  /** De 1 a 5 */
  estrellas: number;
  texto: string;
  creadaEn: number;
}

/** El mensaje del chat con el que el vendedor pide la calificación */
export interface SolicitudCalificacion {
  productoId: string;
  producto: string;
}

export function leerSolicitud(
  valor: unknown,
): SolicitudCalificacion | undefined {
  if (!valor || typeof valor !== "object") return undefined;
  const { productoId, producto } = valor as Record<string, unknown>;
  return typeof productoId === "string" && typeof producto === "string"
    ? { productoId, producto }
    : undefined;
}

/** Qué falta para mandar la reseña; `null` si está lista */
export function faltanteResena(datos: {
  estrellas: number;
  texto: string;
}): string | null {
  if (datos.estrellas < 1 || datos.estrellas > 5)
    return "Elige de 1 a 5 estrellas.";
  if (datos.texto.trim().length === 0) return "Escribe tu reseña.";
  return null;
}
