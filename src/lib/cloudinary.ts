import { File } from "expo-file-system";
import { Platform } from "react-native";

import { shrinkImage } from "./imageShrink";
import { isRemoteImage } from "./imageUrl";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const UPLOAD_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

export class ImageUploadError extends Error {
  constructor(
    message: string,
    /** Un fallo de red o del servidor puede pasar al reintentar; uno de configuración, no. */
    readonly retriable = false,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

/**
 * En web el archivo es un Blob. En iOS y Android el `fetch` global es el de Expo, que no acepta
 * el objeto `{ uri, name, type }` de React Native (falla con "Unsupported FormDataPart
 * implementation"): hay que pasar un `File` de expo-file-system, que sí se puede leer como Blob.
 */
async function appendFile(form: FormData, uri: string): Promise<void> {
  if (Platform.OS === "web") {
    const name = decodeURIComponent(uri.split("?")[0].split("/").pop() || "foto.jpg");
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
    return;
  }
  form.append("file", new File(uri) as unknown as Blob);
}

function describeFailure(status: number, body: unknown): string {
  const message = (body as { error?: { message?: string } } | null)?.error
    ?.message;
  return message ?? `Cloudinary respondió con el código ${status}.`;
}

/** Un intento de subida. Los fallos de red, de tiempo y del servidor (5xx) se marcan como reintentables. */
async function sendOnce(uri: string): Promise<string> {
  const form = new FormData();
  form.append("upload_preset", UPLOAD_PRESET as string);
  await appendFile(form, uri);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: form, signal: controller.signal },
    );
    const body: unknown = await response.json().catch(() => null);
    const url = (body as { secure_url?: string } | null)?.secure_url;
    if (!response.ok || !url) {
      throw new ImageUploadError(
        describeFailure(response.status, body),
        response.status >= 500,
      );
    }
    return url;
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    if (controller.signal.aborted) {
      throw new ImageUploadError("La subida de la imagen tardó demasiado.", true);
    }
    console.warn("Falló la subida a Cloudinary.", error);
    // El motivo técnico ayuda a saber si es la red, el permiso de la foto u otra cosa
    const reason = error instanceof Error ? ` (${error.message})` : "";
    throw new ImageUploadError(
      `No se pudo subir la imagen. Revisa tu conexión.${reason}`,
      true,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sube una imagen a Cloudinary (subida sin firma con un preset) y devuelve su URL https.
 * La foto se reduce antes de subirla y, si la red falla, se reintenta hasta 3 veces.
 * Si `uri` ya es una URL remota la devuelve tal cual.
 */
export async function uploadImage(uri: string): Promise<string> {
  if (isRemoteImage(uri)) return uri;
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new ImageUploadError(
      "Falta configurar Cloudinary (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET).",
    );
  }

  const source = await shrinkImage(uri);
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await sendOnce(source);
    } catch (error) {
      const retry =
        error instanceof ImageUploadError && error.retriable && attempt < MAX_ATTEMPTS;
      if (!retry) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
}

/** Sube varias imágenes de a una, en orden: en una red débil, varias a la vez se estorban y fallan más. */
export async function uploadImages(uris: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const uri of uris) urls.push(await uploadImage(uri));
  return urls;
}