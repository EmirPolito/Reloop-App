import { Platform } from "react-native";

import { coloresCristal } from "@/features/busqueda/components/PildoraCristal";

/**
 * Fondo de la tarjeta de los chats y de las barras de píldoras (chats, favoritos y
 * notificaciones): el mismo blanco translúcido que el buscador y los botones de arriba.
 */
export function fondoCristalSuave(isDark: boolean) {
  return coloresCristal(isDark).fondo;
}

/** Sombra de la tarjeta y las píldoras: suave, pero lo justo para separarlas del fondo */
export const sombraCristalSuave = {
  shadowColor: "#000000",
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
} as const;

/**
 * Fuera de iOS la misma sombra se ve mucho más marcada en los contornos de las tarjetas:
 * ahí va más ligera y corta
 */
const sombraTarjetaLigera = {
  shadowColor: "#000000",
  shadowOpacity: 0.035,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
} as const;

/** Esquinas de las tarjetas de cristal (la de los chats) */
export const RADIO_TARJETA_CRISTAL = 26;

/**
 * La tarjeta de los chats: blanco translúcido, borde de luz y sombra suave. La usan también
 * las tarjetas del perfil (General, Legal, Cerrar sesión) y la de Editar perfil.
 */
export function estiloTarjetaCristal(isDark: boolean) {
  return {
    // En oscuro, un poco más oscura que el cristal de los botones
    backgroundColor: isDark
      ? "rgba(255,255,255,0.05)"
      : fondoCristalSuave(isDark),
    borderColor: coloresCristal(isDark).borde,
    borderWidth: 1,
    borderRadius: RADIO_TARJETA_CRISTAL,
    ...(Platform.OS === "ios" ? sombraCristalSuave : sombraTarjetaLigera),
  } as const;
}
