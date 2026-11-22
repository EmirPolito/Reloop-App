import {
  CON_DESENFOQUE,
  coloresCristal,
} from "@/features/busqueda/components/PildoraCristal";

/**
 * Fondo de la tarjeta de los chats y de las barras de píldoras (chats, favoritos y notificaciones): el cristal de los botones de arriba, pero
 * en claro más transparente (en oscuro, el mismo).
 */
export function fondoCristalSuave(isDark: boolean) {
  if (isDark) return coloresCristal(true).fondo;
  return CON_DESENFOQUE ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.55)";
}

/** Sombra de la tarjeta y las píldoras: más suave que la de los botones de arriba */
export const sombraCristalSuave = {
  shadowColor: "#000000",
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
} as const;
