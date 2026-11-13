import { useEffect, useState } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";
import { subscribeMembership } from "../membershipRepository";
import { isMembershipActive, type Membership } from "../membershipRules";

interface Leida {
  uid: string;
  membership: Membership | null;
}

/** Los temporizadores de JS no admiten esperas mayores a ~24.8 días */
const ESPERA_MAXIMA_MS = 2 ** 31 - 1;

/**
 * `true` mientras la membresía Premium de `uid` esté vigente. Se actualiza sola si un
 * administrador la concede o la revoca, y al llegar su vencimiento.
 */
export function useIsPremium(uid: string): boolean {
  const [leida, setLeida] = useState<Leida | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(
    () =>
      subscribeMembership(
        uid,
        (membership) => {
          setAhora(Date.now());
          setLeida({ uid, membership });
        },
        (error) =>
          console.warn(
            "No se pudo leer la membresía.",
            describeFirestoreError(error),
          ),
      ),
    [uid],
  );

  const membership = leida?.uid === uid ? leida.membership : null;
  const activa = isMembershipActive(membership, ahora);

  // Al vencer, la insignia desaparece sin esperar a otro cambio
  useEffect(() => {
    if (!activa || !membership) return;
    const espera = Math.min(
      membership.expiresAt - Date.now(),
      ESPERA_MAXIMA_MS,
    );
    const temporizador = setTimeout(
      () => setAhora(Date.now()),
      Math.max(espera, 0),
    );
    return () => clearTimeout(temporizador);
  }, [activa, membership, ahora]);

  return activa;
}
