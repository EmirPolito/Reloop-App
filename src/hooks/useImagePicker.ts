import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { showAlert } from "@/utils/alerts";

const SQUARE_IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

const COVER_IMAGE_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.85,
};

const GALLERY_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsMultipleSelection: true,
  quality: 0.8,
};

const SINGLE_GALLERY_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.8,
};

async function ensureLibraryPermission(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showAlert(
      "Permiso necesario",
      "Permite el acceso a tus fotos para elegir una imagen.",
    );
  }
  return permission.granted;
}

function showGalleryError(error: unknown): void {
  showAlert("No se pudo abrir la galería", String(error));
}

/**
 * Acceso a la galería del dispositivo. Centraliza permisos, opciones y errores
 * para que las pantallas solo pidan "una foto cuadrada" o "varias fotos".
 */
export function useImagePicker() {
  const [isPicking, setIsPicking] = useState(false);

  /** Una foto recortada en 1:1 (perfil y publicaciones). `null` si se cancela. */
  const pickSquareImage = useCallback(async (): Promise<string | null> => {
    setIsPicking(true);
    try {
      if (!(await ensureLibraryPermission())) return null;
      const result =
        await ImagePicker.launchImageLibraryAsync(SQUARE_IMAGE_OPTIONS);
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    } catch (error) {
      showGalleryError(error);
      return null;
    } finally {
      setIsPicking(false);
    }
  }, []);

  /** Una foto horizontal (4:3) para la portada del perfil. `null` si se cancela. */
  const pickCoverImage = useCallback(async (): Promise<string | null> => {
    setIsPicking(true);
    try {
      if (!(await ensureLibraryPermission())) return null;
      const result =
        await ImagePicker.launchImageLibraryAsync(COVER_IMAGE_OPTIONS);
      return result.canceled ? null : (result.assets[0]?.uri ?? null);
    } catch (error) {
      showGalleryError(error);
      return null;
    } finally {
      setIsPicking(false);
    }
  }, []);

  /** Varias fotos sin recortar (chat). Si la selección múltiple falla, pide una sola. */
  const pickImages = useCallback(async (): Promise<string[]> => {
    setIsPicking(true);
    try {
      if (!(await ensureLibraryPermission())) return [];
      try {
        const result =
          await ImagePicker.launchImageLibraryAsync(GALLERY_OPTIONS);
        return result.canceled
          ? []
          : result.assets.map((asset) => asset.uri).filter(Boolean);
      } catch (error) {
        console.warn("No se pudo abrir la selección múltiple:", error);
        const result = await ImagePicker.launchImageLibraryAsync(
          SINGLE_GALLERY_OPTIONS,
        );
        return result.canceled
          ? []
          : result.assets.slice(0, 1).map((asset) => asset.uri);
      }
    } catch (error) {
      showGalleryError(error);
      return [];
    } finally {
      setIsPicking(false);
    }
  }, []);

  return { isPicking, pickSquareImage, pickCoverImage, pickImages };
}
