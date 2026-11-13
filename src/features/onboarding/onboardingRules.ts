/* -------------------------------------------------------------------------- */
/*  Configuración inicial (onboarding): reglas puras                          */
/* -------------------------------------------------------------------------- */

export const PASOS_ONBOARDING = ["portada", "avatar", "identidad"] as const;
export type PasoOnboarding = (typeof PASOS_ONBOARDING)[number];

export const TITULOS_ONBOARDING: Record<PasoOnboarding, string> = {
  portada: "Elige tu portada",
  avatar: "Elige tu avatar",
  identidad: "Tu identidad",
};

/** Índice guardado → paso; cualquier valor inválido vuelve al primero */
export function pasoDesdeIndice(valor: unknown): number {
  const indice = Number(valor);
  return Number.isInteger(indice) &&
    indice >= 0 &&
    indice < PASOS_ONBOARDING.length
    ? indice
    : 0;
}

/**
 * Solo se puede terminar con un @username asignado (se asigna solo al entrar, y se puede
 * cambiar en el paso de identidad).
 */
export function puedeFinalizar(username: string | null): boolean {
  return username !== null && username.length > 0;
}
