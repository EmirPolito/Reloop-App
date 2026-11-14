import type { Unsubscribe } from "firebase/firestore";
import { useCallback, useSyncExternalStore } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";

/**
 * Cuánto se mantiene viva una suscripción después de que el último componente deja de
 * mostrarla: al desplazar una lista, las tarjetas se montan y desmontan sin parar, y así
 * volver a ver a la misma persona no vuelve a leerla del servidor.
 */
const GRACIA_MS = 60_000;

interface Entrada<T> {
  /** `undefined`: aún no llega */
  valor: T | undefined;
  oyentes: Set<() => void>;
  cancelar: Unsubscribe | null;
  temporizador: ReturnType<typeof setTimeout> | null;
}

/**
 * Crea un hook que comparte UNA suscripción de Firestore por clave (p. ej. por uid) entre
 * todos los componentes que la usan. Devuelve `undefined` mientras llega el primer valor.
 */
export function crearSuscripcionCompartida<T>(
  nombre: string,
  suscribir: (
    clave: string,
    alDato: (valor: T) => void,
    alError: (error: unknown) => void,
  ) => Unsubscribe,
) {
  const entradas = new Map<string, Entrada<T>>();

  function entradaDe(clave: string): Entrada<T> {
    let entrada = entradas.get(clave);
    if (!entrada) {
      entrada = {
        valor: undefined,
        oyentes: new Set(),
        cancelar: null,
        temporizador: null,
      };
      entradas.set(clave, entrada);
    }
    return entrada;
  }

  function escuchar(clave: string, oyente: () => void): () => void {
    const entrada = entradaDe(clave);
    entrada.oyentes.add(oyente);
    if (entrada.temporizador) {
      clearTimeout(entrada.temporizador);
      entrada.temporizador = null;
    }
    if (!entrada.cancelar) {
      entrada.cancelar = suscribir(
        clave,
        (valor) => {
          entrada.valor = valor;
          entrada.oyentes.forEach((avisar) => avisar());
        },
        (error) => {
          console.warn(
            `No se pudo leer ${nombre}.`,
            describeFirestoreError(error),
          );
          // Firestore cierra la suscripción al fallar: la próxima vez se vuelve a abrir
          entrada.cancelar?.();
          entrada.cancelar = null;
        },
      );
    }
    return () => {
      entrada.oyentes.delete(oyente);
      if (entrada.oyentes.size === 0 && !entrada.temporizador) {
        entrada.temporizador = setTimeout(() => {
          entrada.cancelar?.();
          entrada.cancelar = null;
          entrada.temporizador = null;
        }, GRACIA_MS);
      }
    };
  }

  return function useSuscripcionCompartida(clave: string): T | undefined {
    const suscribirse = useCallback(
      (oyente: () => void) => escuchar(clave, oyente),
      [clave],
    );
    return useSyncExternalStore(suscribirse, () => entradaDe(clave).valor);
  };
}
