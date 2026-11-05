import { ImageUploadError } from "@/lib/cloudinary";

const GENERIC_FAILURE = "Revisa tu conexión e inténtalo de nuevo.";

/** Texto para mostrar a la persona: el de un fallo de subida de imagen, o uno genérico. */
export function userMessageFor(
  error: unknown,
  fallback: string = GENERIC_FAILURE,
): string {
  return error instanceof ImageUploadError ? error.message : fallback;
}
