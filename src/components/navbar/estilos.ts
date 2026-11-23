import { StyleSheet } from "react-native";
import { Easing } from "react-native-reanimated";

import {
  coloresCristal,
  fondoCristalVisto,
} from "@/features/busqueda/components/PildoraCristal";

/* Medidas */

/** Alto de la cápsula de pestañas y lado del botón de crear */
export const ALTO_CAPSULA = 60;
/** Margen interno de la cápsula: el aire entre su borde y la píldora */
export const MARGEN_CAPSULA = 5;
export const TAMANO_ICONO = 23;
export const TAMANO_ICONO_CREAR = 34;
/** Espacio entre la cápsula y el botón de crear */
const SEPARACION_CREAR = 10;

/* Curvas sedosas estilo iOS (desaceleración larga, cero rebote) */

export const CURVA_SEDOSA = Easing.bezier(0.16, 1, 0.3, 1);
export const TIMING_PILDORA = { duration: 310, easing: CURVA_SEDOSA };
export const APARECER = { duration: 160, easing: CURVA_SEDOSA };
export const MENU_ABRIR = {
  duration: 210,
  easing: Easing.bezier(0.16, 1, 0.3, 1),
};
export const MENU_CERRAR = { duration: 140, easing: Easing.out(Easing.cubic) };

const SOMBRA_CRISTAL = "0 4px 14px rgba(0, 0, 0, 0.08)";

export type Estilos = ReturnType<typeof crearEstilos>;

/** Estilos del nav según el tema (también los usa el menú de crear de las otras barras) */
export function crearEstilos(isDark: boolean) {
  const vidrio = coloresCristal(isDark);
  const colors = isDark
    ? {
        cristal: fondoCristalVisto(true),
        borde: vidrio.borde,
        bordeSuperior: vidrio.borde,
        separador: "rgba(255, 255, 255, 0.10)",
        indicador: "rgba(255, 255, 255, 0.14)",
        sombra: SOMBRA_CRISTAL,
        fondoContador: "#222226",
        text: "#FFFFFF",
      }
    : {
        cristal: fondoCristalVisto(false),
        borde: vidrio.borde,
        bordeSuperior: vidrio.borde,
        separador: "rgba(0, 0, 0, 0.06)",
        indicador: "rgba(120, 120, 128, 0.14)",
        sombra: SOMBRA_CRISTAL,
        fondoContador: "#EBEBEF",
        text: "#101010",
      };

  return StyleSheet.create({
    contenedorPantalla: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    },

    navigationRow: {
      position: "absolute",
      left: 18,
      right: 18,
      flexDirection: "row",
      alignItems: "center",
    },

    sombra: {
      borderRadius: ALTO_CAPSULA / 2,
      boxShadow: colors.sombra,
    },

    capsulaSombra: { flex: 1 },

    crearSombra: { marginLeft: SEPARACION_CREAR },

    crearCirculo: {
      width: ALTO_CAPSULA,
      height: ALTO_CAPSULA,
      borderRadius: ALTO_CAPSULA / 2,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },

    capsula: {
      height: ALTO_CAPSULA,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: MARGEN_CAPSULA,
      borderRadius: ALTO_CAPSULA / 2,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
    },

    cristalTinte: {
      backgroundColor: colors.cristal,
    },

    indicador: {
      position: "absolute",
      left: MARGEN_CAPSULA,
      top: MARGEN_CAPSULA,
      bottom: MARGEN_CAPSULA,
      borderRadius: (ALTO_CAPSULA - MARGEN_CAPSULA * 2) / 2,
      backgroundColor: colors.indicador,
    },

    hueco: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },

    icono: {
      width: TAMANO_ICONO + 3,
      height: TAMANO_ICONO + 3,
      alignItems: "center",
      justifyContent: "center",
    },

    iconoCrear: {
      width: TAMANO_ICONO_CREAR + 4,
      height: TAMANO_ICONO_CREAR + 4,
      alignItems: "center",
      justifyContent: "center",
    },

    iconoCapa: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },

    punto: {
      position: "absolute",
      top: -1,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF3366",
      borderWidth: 1,
      borderColor: colors.fondoContador,
    },

    menuSombra: {
      position: "absolute",
      right: 14,
      borderRadius: 22,
      boxShadow: colors.sombra,
      transformOrigin: "right bottom",
    },

    menuCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.borde,
      borderTopColor: colors.bordeSuperior,
      overflow: "hidden",
      paddingVertical: 4,
      paddingHorizontal: 6,
    },

    menuOpcion: {
      height: 44,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 12,
    },

    menuOpcionSeparador: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separador,
    },

    menuEtiqueta: {
      color: colors.text,
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
    },
  });
}
