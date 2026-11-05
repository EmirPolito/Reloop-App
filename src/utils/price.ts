/**
 * Convierte el texto de un campo de precio en número.
 * Acepta coma o punto decimal (el teclado numérico cambia según el idioma).
 * Devuelve `null` si está vacío, no es un número o es negativo.
 */
export function parsePrice(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
