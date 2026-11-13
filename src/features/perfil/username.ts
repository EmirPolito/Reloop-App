/* -------------------------------------------------------------------------- */
/*  @username: reglas puras (sin Firebase ni React Native)                    */
/* -------------------------------------------------------------------------- */

export const MIN_USERNAME = 3;
export const MAX_USERNAME = 20;

/** Mismo patrón que valida `firestore.rules` (colección `usernames`) */
export const PATRON_USERNAME = /^[a-z0-9_]{3,20}$/;

/**
 * Nombres que nadie puede tomar: confunden con la app, con su equipo o con funciones del
 * sistema. Los primeros también están en `firestore.rules`, así que no se pueden saltar.
 */
const RESERVADOS = new Set([
  "admin",
  "administrador",
  "reloop",
  "soporte",
  "support",
  "ayuda",
  "help",
  "moderador",
  "staff",
  "oficial",
  "official",
  "sistema",
  "system",
  "root",
  "null",
  "undefined",
  "usuario",
  "user",
  "premium",
  "anuncios",
  "seguridad",
]);

/** Fragmentos ofensivos: si el username los contiene, se rechaza */
const INAPROPIADOS = [
  "puta",
  "puto",
  "pendej",
  "verga",
  "chinga",
  "culero",
  "mierda",
  "joto",
  "marica",
  "nazi",
  "porno",
  "fuck",
  "shit",
];

/** Quita acentos y signos diacríticos ("José" → "Jose") */
function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Forma canónica para guardar, comparar y buscar: sin "@" inicial, sin espacios a los lados
 * y en minúsculas. No quita caracteres inválidos: eso lo decide `validarUsername`.
 */
export function normalizarUsername(texto: string): string {
  return texto.trim().replace(/^@+/, "").toLowerCase();
}

/** Nombre visible en minúsculas y sin acentos, para buscar por prefijo */
export function normalizarNombre(nombre: string): string {
  return sinAcentos(nombre).trim().toLowerCase();
}

export type MotivoInvalido =
  | "corto"
  | "largo"
  | "caracteres"
  | "sinLetras"
  | "reservado"
  | "inapropiado";

export const MENSAJE_INVALIDO: Record<MotivoInvalido, string> = {
  corto: `Usa al menos ${MIN_USERNAME} caracteres`,
  largo: `Usa como máximo ${MAX_USERNAME} caracteres`,
  caracteres: "Solo letras minúsculas, números y guion bajo",
  sinLetras: "Incluye al menos una letra",
  reservado: "Ese nombre está reservado",
  inapropiado: "Elige otro nombre",
};

/** `null` si el username (ya normalizado) es válido; si no, el motivo */
export function validarUsername(username: string): MotivoInvalido | null {
  if (username.length < MIN_USERNAME) return "corto";
  if (username.length > MAX_USERNAME) return "largo";
  if (!PATRON_USERNAME.test(username)) return "caracteres";
  if (!/[a-z]/.test(username)) return "sinLetras";
  if (RESERVADOS.has(username)) return "reservado";
  if (INAPROPIADOS.some((palabra) => username.includes(palabra))) {
    return "inapropiado";
  }
  return null;
}

/**
 * Username propuesto a partir del nombre ("José Pérez" → "joseperez"). Si queda vacío,
 * corto o no válido, usa "reloop"; `sufijo` (números) evita choques con otros usuarios.
 */
export function sugerirUsername(nombre: string, sufijo = ""): string {
  const base = sinAcentos(nombre)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, MAX_USERNAME - sufijo.length);
  const propuesto = `${base}${sufijo}`;
  return validarUsername(propuesto) === null
    ? propuesto
    : `reloop${sufijo || "_"}`.slice(0, MAX_USERNAME);
}

/** Para mostrar en la interfaz: "@username" */
export function conArroba(username: string): string {
  return `@${username}`;
}
