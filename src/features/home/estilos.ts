import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Estilos del inicio que dependen del tema (claro u oscuro) */
function crearEstilos(isDark: boolean) {
  return StyleSheet.create({
    // La lista: ancho completo hasta 760 y centrada
    lista: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
    // Margen a los lados y espacio abajo para que el nav no tape la última publicación
    contenido: { width: "100%", paddingHorizontal: 16, paddingBottom: 120 },
    // Dos publicaciones sueltas lado a lado
    filaPublicaciones: {
      width: "100%",
      flexDirection: "row",
      alignItems: "stretch",
      gap: 16,
      marginBottom: 16,
    },
    // La tarjeta grande ocupa todo el ancho (mide sus fotos según su ancho)
    filaVendedor: { width: "100%", marginBottom: 17 },
    logo: { width: 92, height: 38 },
    // "Todas las publicaciones" y, a la derecha, cuántas hay
    encabezadoSeccion: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      // Justo después del banner: separado de él, pero sin tanto aire
      marginTop: 15,
      marginBottom: 13,
    },
    tituloSeccion: {
      color: isDark ? "#F5F4FA" : "#23242C",
      fontSize: 17,
    },
  });
}

/** Los estilos del inicio para el tema actual (se crean una vez por tema) */
export function useEstilosInicio() {
  const { isDark } = useAppTheme();
  return useMemo(() => crearEstilos(isDark), [isDark]);
}
