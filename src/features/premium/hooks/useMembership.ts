import { useEffect, useState } from "react";

import { crearSuscripcionCompartida } from "@/lib/sharedSubscription";
import { subscribeMembership } from "../membershipRepository";
import { isMembershipActive, type Membership } from "../membershipRules";

/** Los temporizadores de JS no admiten esperas mayores a ~24.8 días */
const ESPERA_MAXIMA_MS = 2 ** 31 - 1;
/** Margen para que el temporizador dispare ya pasado el vencimiento */
const MARGEN_MS = 100;

/**
 * Membresía de `uid` compartida por toda la app (una suscripción por persona, aunque
 * aparezca en muchas tarjetas) con la hora a la que llegó, para juzgar su vigencia sin
 * leer el reloj al dibujar.
 */
const useMembresiaDe = crearSuscripcionCompartida<{
  membership: Membership | null;
  recibidaEn: number;
}>("una membresía", (uid, alDato, alError) =>
  subscribeMembership(
    uid,
    (membership) => alDato({ membership, recibidaEn: Date.now() }),
    alError,
  ),
);

/**
 * `true` mientras la membresía Premium de `uid` esté vigente. Se actualiza sola si un
 * administrador la concede o la revoca, y al llegar su vencimiento.
 */
export function useIsPremium(uid: string): boolean {
  const leida = useMembresiaDe(uid);
  const [ahora, setAhora] = useState(() => Date.now());

  const membership = leida?.membership ?? null;
  const activa = isMembershipActive(
    membership,
    Math.max(ahora, leida?.recibidaEn ?? 0),
  );

  // Al vencer, la insignia desaparece sin esperar a otro cambio
  useEffect(() => {
    if (!activa || !membership) return;
    const espera = Math.min(
      membership.expiresAt - Date.now() + MARGEN_MS,
      ESPERA_MAXIMA_MS,
    );
    const temporizador = setTimeout(
      () => setAhora(Date.now()),
      Math.max(espera, 0),
    );
    return () => clearTimeout(temporizador);
  }, [activa, membership]);

  return activa;
}
