/* -------------------------------------------------------------------------- */
/*  Tema propio de la configuración inicial (independiente de Editar perfil)  */
/* -------------------------------------------------------------------------- */

/** Tipografía: todo en Inter */
export const LETRA = {
  regular: { fontFamily: "Inter_400Regular" },
  medium: { fontFamily: "Inter_500Medium" },
  semibold: { fontFamily: "Inter_600SemiBold" },
  bold: { fontFamily: "Inter_700Bold" },
} as const;

/** Lo que suben los carruseles (avatares y fondos) sin mover lo de abajo */
export const SUBIR_CARRUSEL = 5;

/** Radio de la card del drawer */
export const RADIO_HOJA = 35;

/** Colores según el tema */
export function coloresOnboarding(isDark: boolean) {
  return {
    hoja: isDark ? "#0B1220" : "#FFFFFF",
    texto: isDark ? "#F1F5F9" : "#101010",
    suave: isDark ? "#94A3B8" : "#8A8A8A",
    icono: isDark ? "#CBD5E1" : "#5D5D5D",
    botonHeader: isDark ? "#17233A" : "#F2F2F2",
    tarjeta: isDark ? "#1E293B" : "#F4F4F6",
    divisor: isDark ? "#334155" : "#E6E6EA",
    chip: isDark ? "#1E293B" : "#F1F1F3",
    // Campo de escribir: redondo, del mismo color que las etiquetas
    campo: isDark ? "#1E293B" : "#F1F1F3",
    campoTexto: isDark ? "#F1F5F9" : "#101010",
    campoPlaceholder: "#8E8E93",
    // Botón de la palomita dentro del campo: círculo negro con la palomita blanca
    palomitaFondo: isDark ? "#F1F5F9" : "#101010",
    palomitaIcono: isDark ? "#101010" : "#FFFFFF",
    // Icono elegido en el selector de iconos
    iconoElegido: isDark ? "#334155" : "#E2E2E7",
    error: "#FF3B30",
  };
}
