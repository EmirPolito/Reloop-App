import { useEffect, useRef, type RefObject } from "react";

/**
 * Referencia que siempre apunta al último valor renderizado.
 * Sirve para callbacks estables (gestos, timers, botones memoizados) que
 * necesitan leer el estado actual sin volver a crearse.
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
