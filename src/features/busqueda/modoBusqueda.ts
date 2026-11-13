import { normalizarNombre } from "@/features/perfil/username";

/**
 * Qué busca el input del inicio: productos (por defecto) o personas, cuando el texto
 * empieza con "@". Borrar el "@" vuelve a productos.
 */
export type ModoBusqueda =
  | { modo: "productos"; termino: string }
  /** `termino` ya normalizado (sin "@", minúsculas y sin acentos); vacío con solo "@" */
  | { modo: "usuarios"; termino: string };

export function modoDeBusqueda(texto: string): ModoBusqueda {
  const limpio = texto.trimStart();
  if (limpio.startsWith("@")) {
    return { modo: "usuarios", termino: normalizarNombre(limpio.slice(1)) };
  }
  return { modo: "productos", termino: texto.trim() };
}
