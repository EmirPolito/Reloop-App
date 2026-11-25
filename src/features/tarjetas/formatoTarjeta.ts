/**
 * Formato de los campos de una tarjeta mientras se escriben, y lo que se guarda o se manda.
 * Lógica pura (sin React ni Firebase): tiene pruebas en `tests/domain.test.ts`.
 */

/** Cuántas tarjetas puede guardar cada persona */
export const MAX_TARJETAS = 5;

export const LARGO_BENEFICIARIO = 26;
export const LARGO_INSTITUCION = 30;
/** La CLABE interbancaria tiene 18 dígitos */
export const DIGITOS_CLAVE = 18;

/** Los cinco colores del selector (el nombre es el que se guarda) */
export const COLORES_TARJETA = [
  "rojo",
  "amarillo",
  "azul",
  "negro",
  "morado",
] as const;
export type ColorTarjeta = (typeof COLORES_TARJETA)[number];
/** Lo que se puede dibujar: además, el gris de la tarjeta nueva mientras no se elige diseño */
export type ColorVista = ColorTarjeta | "gris";

/** Los datos para recibir una transferencia: es lo que se guarda y lo que viaja en el chat */
export interface TarjetaCompartida {
  institucion: string;
  /** La CLABE, solo dígitos */
  clave: string;
  beneficiario: string;
  color: ColorTarjeta;
}

/** Una tarjeta guardada */
export interface Tarjeta extends TarjetaCompartida {
  id: string;
}

export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** "002180012345678910" → "0021 8001 2345 6789 10" (acepta lo que se escriba o pegue) */
export function formatearClave(texto: string): string {
  const digitos = soloDigitos(texto).slice(0, DIGITOS_CLAVE);
  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Sin espacios al inicio ni dobles */
function limpiarEspacios(texto: string): string {
  return texto.replace(/ {2,}/g, " ").replace(/^ /, "");
}

/** El beneficiario en mayúsculas, solo letras y espacios */
export function formatearBeneficiario(texto: string): string {
  return limpiarEspacios(
    texto.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ ]/g, ""),
  ).slice(0, LARGO_BENEFICIARIO);
}

/** La institución en mayúsculas (puede llevar números, como "BANCO 1") */
export function formatearInstitucion(texto: string): string {
  return limpiarEspacios(
    texto.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ0-9 &.-]/g, ""),
  ).slice(0, LARGO_INSTITUCION);
}

/** La clave completa con espacios, o "•••• •••• •••• 0806" (solo los últimos 4) */
export function claveEnTarjeta(clave: string, visible: boolean): string {
  if (visible && clave) return formatearClave(clave);
  return `•••• •••• •••• ${ultimos4(clave)}`;
}

export function ultimos4(clave: string): string {
  return clave.slice(-4).padStart(4, "•");
}

/** "SAURABH CHAUHAN" → "Saurabh Chauhan", como en la funda */
export function nombrePropio(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

/** Qué falta para poder guardar la tarjeta; `null` si está completa */
export function faltanteTarjeta(datos: {
  institucion: string;
  clave: string;
  beneficiario: string;
}): string | null {
  if (datos.institucion.trim().length === 0)
    return "Escribe la institución financiera.";
  if (soloDigitos(datos.clave).length !== DIGITOS_CLAVE)
    return `La clave debe tener ${DIGITOS_CLAVE} dígitos.`;
  if (datos.beneficiario.trim().length === 0)
    return "Escribe el nombre del beneficiario.";
  return null;
}

/** El texto de "Copiar datos": la clave sin espacios, para pegarla en el banco */
export function textoParaCopiar(tarjeta: TarjetaCompartida): string {
  return [
    `Beneficiario: ${tarjeta.beneficiario}`,
    `Institución: ${tarjeta.institucion}`,
    `CLABE: ${tarjeta.clave}`,
  ].join("\n");
}

/** Lo que llega de Firestore como tarjeta, o `undefined` si no es válida */
export function leerTarjetaCompartida(
  valor: unknown,
): TarjetaCompartida | undefined {
  if (!valor || typeof valor !== "object") return undefined;
  const { institucion, clave, beneficiario, color } = valor as Record<
    string,
    unknown
  >;
  if (
    typeof institucion !== "string" ||
    typeof clave !== "string" ||
    typeof beneficiario !== "string"
  )
    return undefined;
  return {
    institucion,
    clave,
    beneficiario,
    color: COLORES_TARJETA.includes(color as ColorTarjeta)
      ? (color as ColorTarjeta)
      : "negro",
  };
}
