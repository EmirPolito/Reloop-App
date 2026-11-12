import { Alert, Platform, type AlertButton } from "react-native";

import { userMessageFor } from "./errors";

/**
 * `Alert.alert` de React Native no hace nada en la web, así que allí se usan los diálogos
 * del navegador. Con dos botones o más se muestra una confirmación: aceptar ejecuta el
 * primer botón que no es "cancel" y cancelar ejecuta el botón "cancel".
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  if (buttons && buttons.length > 1) {
    const accepted = window.confirm(text);
    buttons
      .find((button) => (accepted ? button.style !== "cancel" : button.style === "cancel"))
      ?.onPress?.();
    return;
  }
  window.alert(text);
  buttons?.[0]?.onPress?.();
}

export function showComingSoonAlert(title: string): void {
  showAlert(title, "Esta función estará disponible próximamente.");
}

/** Avisa de que una acción falló; el detalle solo se muestra si ayuda (p. ej. Cloudinary sin configurar). */
export function showErrorAlert(title: string, error: unknown): void {
  console.warn(title, error);
  showAlert(title, userMessageFor(error));
}