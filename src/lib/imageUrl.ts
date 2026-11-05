/** El ancho se redondea hacia arriba a este múltiplo: menos variantes distintas que generar y guardar en caché. */
const WIDTH_STEP = 100;

/** `true` si la imagen ya está alojada (no hay que subirla otra vez). */
export function isRemoteImage(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

/**
 * URL de una imagen de Cloudinary ya redimensionada y comprimida (formato y calidad
 * automáticos). Cualquier otra URL (una foto local aún sin subir, por ejemplo) se
 * devuelve igual.
 */
export function optimizedImageUrl(url: string | null, width: number): string | null {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  const bucket = Math.max(WIDTH_STEP, Math.ceil(width / WIDTH_STEP) * WIDTH_STEP);
  const transformation = `f_auto,q_auto,c_limit,w_${bucket}`;
  return url.replace("/image/upload/", `/image/upload/${transformation}/`);
}
