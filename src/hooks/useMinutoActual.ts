import { useSyncExternalStore } from "react";

/**
 * Un solo reloj para toda la app que avanza cada minuto (justo al cambiar de minuto). Lo
 * usan los textos como "Hace 5 min": así se actualizan solos sin un intervalo por tarjeta.
 */
let ahora = Date.now();
const oyentes = new Set<() => void>();
let temporizador: ReturnType<typeof setTimeout> | undefined;

function programar() {
  temporizador = setTimeout(
    () => {
      ahora = Date.now();
      oyentes.forEach((oyente) => oyente());
      programar();
    },
    60_000 - (Date.now() % 60_000),
  );
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  if (oyentes.size === 1) {
    ahora = Date.now();
    programar();
  }
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) clearTimeout(temporizador);
  };
}

const leer = () => ahora;

/** La hora actual (ms), que se renueva cada minuto */
export function useMinutoActual(): number {
  return useSyncExternalStore(suscribir, leer, leer);
}
