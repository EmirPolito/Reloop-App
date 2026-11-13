import type { Unsubscribe } from "firebase/firestore";
import { useCallback, useSyncExternalStore } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";
import type { DatosPerfil } from "../Perfiltemas";
import { subscribeProfile } from "../profileRepository";

/**
 * Perfiles públicos compartidos por toda la app: una sola suscripción por persona, aunque
 * su avatar aparezca en muchas tarjetas a la vez. Se cancela cuando ya nadie la muestra y
 * se recuerda el último valor, así volver a verla es instantáneo.
 */
interface Entrada {
  /** `undefined`: aún no llega; `null`: no tiene ficha */
  perfil: DatosPerfil | null | undefined;
  oyentes: Set<() => void>;
  cancelar: Unsubscribe | null;
}

const entradas = new Map<string, Entrada>();

function entradaDe(uid: string): Entrada {
  let entrada = entradas.get(uid);
  if (!entrada) {
    entrada = { perfil: undefined, oyentes: new Set(), cancelar: null };
    entradas.set(uid, entrada);
  }
  return entrada;
}

function escuchar(uid: string, oyente: () => void): () => void {
  const entrada = entradaDe(uid);
  entrada.oyentes.add(oyente);
  if (!entrada.cancelar) {
    entrada.cancelar = subscribeProfile(
      uid,
      (perfil) => {
        entrada.perfil = perfil;
        entrada.oyentes.forEach((avisar) => avisar());
      },
      (error) =>
        console.warn(
          "No se pudo leer un perfil.",
          describeFirestoreError(error),
        ),
    );
  }
  return () => {
    entrada.oyentes.delete(oyente);
    if (entrada.oyentes.size === 0) {
      entrada.cancelar?.();
      entrada.cancelar = null;
    }
  };
}

/** Perfil actual de `uid` (foto, avatar orbe, nombre, @username); `undefined` mientras llega */
export function usePerfilDe(uid: string): DatosPerfil | null | undefined {
  const subscribe = useCallback(
    (oyente: () => void) => escuchar(uid, oyente),
    [uid],
  );
  return useSyncExternalStore(subscribe, () => entradaDe(uid).perfil);
}
