import { Easing } from "react-native-reanimated";

/** Tipografía de la pantalla Editar perfil: todo en Inter */
export const INTER = {
  regular: { fontFamily: "Inter_400Regular" },
  medium: { fontFamily: "Inter_500Medium" },
  semibold: { fontFamily: "Inter_600SemiBold" },
} as const;

/** Movimiento: corto y suave, sin rebotes */
export const DURACION_EDITAR = 200;
export const EASE_EDITAR = Easing.out(Easing.cubic);

/** Alto del contenido de los drawers de Editar perfil: el del fondo sin el botón negro (con él crece) */
export const ALTO_CONTENIDO_SHEET = 223;

/** Lado del círculo de la cámara y del recorte de la foto */
export const LADO_CIRCULO = 230;

/** Colores de la pantalla según el tema */
export function coloresEditar(isDark: boolean) {
  return {
    texto: isDark ? "#F1F5F9" : "#101010",
    // En oscuro, claro pero no tanto (el gris azulado casi no se leía)
    suave: isDark ? "#C4C7CC" : "#8a8a8a",
    icono: isDark ? "#CBD5E1" : "#5d5d5d",
    tarjeta: isDark ? "#1E293B" : "#FFFFFF",
    divisor: isDark ? "rgba(255,255,255,0.12)" : "#EFEFF2",
    boton: isDark ? "#ffffff1a" : "#ffffffb7",
    bordeBoton: isDark ? "#ffffff33" : "#ffffffff",
    avatarFondo: isDark ? "#26272B" : "#E7E7E9",
  };
}
