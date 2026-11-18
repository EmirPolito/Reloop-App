/* -------------------------------------------------------------------------- */
/*  Configuración inicial (onboarding): reglas puras                          */
/* -------------------------------------------------------------------------- */

import { MAX_PILDORAS } from "@/features/perfil/Perfiltemas";

export const PASOS_ONBOARDING = [
  "avatar",
  "fondo",
  "etiquetas",
  "usuario",
] as const;
export type PasoOnboarding = (typeof PASOS_ONBOARDING)[number];

export const TITULOS_ONBOARDING: Record<PasoOnboarding, string> = {
  avatar: "Elige tu avatar",
  fondo: "Elige tu fondo",
  etiquetas: `Hasta ${MAX_PILDORAS} etiquetas`,
  usuario: "Cambiar username",
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
 * cambiar en el último paso).
 */
export function puedeFinalizar(username: string | null): boolean {
  return username !== null && username.length > 0;
}
