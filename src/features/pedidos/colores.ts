/** El azul del botón principal de pedir */
export const AZUL_PEDIR = "#11A8FF";

/** Colores de la publicación, el pedido y las reseñas, en claro y oscuro */
export function coloresPedido(isDark: boolean) {
  return isDark
    ? {
        texto: "#F5F5F5",
        suave: "#A3A3A3",
        /** neutral-100 en claro; en oscuro, un gris que se distingue del fondo */
        neutro: "#262626",
        tarjeta: "#1C1C1C",
        borde: "rgba(255,255,255,0.08)",
        linea: "rgba(255,255,255,0.14)",
      }
    : {
        texto: "#171717",
        suave: "#8A8A8A",
        neutro: "#F5F5F5",
        tarjeta: "#FFFFFF",
        borde: "#EDEDED",
        linea: "#D4D4D4",
      };
}
