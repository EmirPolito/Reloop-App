import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

/** Lado más largo, en píxeles, al que se reducen las fotos antes de subirlas. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.75;

/**
 * Reduce y comprime una foto local antes de subirla. Una foto de cámara pesa varios MB y, en
 * una red débil (3G), la conexión se corta a mitad de la subida; reducida pesa unos cientos de KB.
 * Si algo falla se devuelve la foto original, para que la subida se intente igual.
 */
export async function shrinkImage(uri: string): Promise<string> {
  if (Platform.OS === "web") return uri;
  try {
    const original = await ImageManipulator.ImageManipulator.manipulate(
      uri,
    ).renderAsync();
    const context = ImageManipulator.ImageManipulator.manipulate(uri);
    if (Math.max(original.width, original.height) > MAX_SIDE) {
      context.resize(
        original.width >= original.height
          ? { width: MAX_SIDE }
          : { height: MAX_SIDE },
      );
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    });
    return saved.uri;
  } catch (error) {
    console.warn("No se pudo reducir la foto; se sube tal cual.", error);
    return uri;
  }
}
