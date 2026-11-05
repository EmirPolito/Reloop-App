import { useContext, type Context } from "react";

/**
 * Lee un contexto que debe tener Provider; si falta, falla con un mensaje claro
 * en lugar de devolver `null` y romper más adelante.
 */
export function useRequiredContext<T>(
  context: Context<T | null>,
  providerName: string,
): T {
  const value = useContext(context);
  if (value === null) {
    throw new Error(`Este hook debe usarse dentro de <${providerName}>.`);
  }
  return value;
}
