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

/** Lado del círculo de la cámara y del recorte de la foto */
export const LADO_CIRCULO = 230;

/** Colores de la pantalla según el tema */
export function coloresEditar(isDark: boolean) {
  return {
    texto: isDark ? "#F1F5F9" : "#101010",
    suave: isDark ? "#94A3B8" : "#8a8a8a",
    icono: isDark ? "#CBD5E1" : "#5d5d5d",
    tarjeta: isDark ? "#1E293B" : "#FFFFFF",
    divisor: isDark ? "#334155" : "#EFEFF2",
    boton: isDark ? "#ffffff1a" : "#ffffffb7",
    bordeBoton: isDark ? "#ffffff33" : "#ffffffff",
    avatarFondo: isDark ? "#273449" : "#E7E7E9",
  };
}
