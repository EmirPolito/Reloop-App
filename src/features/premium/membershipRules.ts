import type { DocumentData } from "firebase/firestore";

import { toMillis } from "@/lib/firestoreValues";

/** Membresía de una persona tal como la guarda `membresias/{uid}` */
export interface Membership {
  plan: "premium";
  /** Fin de la vigencia (ms) */
  expiresAt: number;
}

/**
 * Lee `membresias/{uid}`; `null` si falta o está mal formado. La app no escribe esta
 * colección: la concede un administrador (consola de Firebase o, más adelante, la pantalla
 * de administración) y las reglas impiden que alguien se la dé desde su teléfono.
 */
export function mapMembership(
  data: DocumentData | undefined,
): Membership | null {
  if (!data || data.plan !== "premium") return null;
  const expiresAt = toMillis(data.venceEn);
  return expiresAt > 0 ? { plan: "premium", expiresAt } : null;
}

/** Vigente si todavía no llega su fecha de vencimiento; vencida deja de dar beneficios */
export function isMembershipActive(
  membership: Membership | null,
  now: number,
): boolean {
  return membership !== null && membership.expiresAt > now;
}
