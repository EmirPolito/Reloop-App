import { Timestamp } from "firebase/firestore";

/** Milisegundos de un valor de fecha de Firestore (0 si aún no existe). */
export function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return 0;
}

/** Primer error legible de Firestore para el registro de consola. */
export function describeFirestoreError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message;
  return [code, message].filter(Boolean).join(": ") || String(error);
}
