import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { APP_BACKGROUND } from "@/features/shared/constants";
import { ALTO_PILDORA } from "./components/PildoraCristal";

/** Botón de volver: del alto del buscador, sin pasarlo */
const LADO_VOLVER = ALTO_PILDORA;

/** Colores del módulo según el tema */
export interface ColoresBusqueda {
  fondo: string;
  texto: string;
  suave: string;
  /** Fondo del cuadro con la lupa de las recientes e ideas */
  caja: string;
}

/** Los colores del módulo para el tema actual */
export function useColoresBusqueda(): ColoresBusqueda {
  const { isDark } = useAppTheme();
  return useMemo(
    () =>
      isDark
        ? {
            fondo: APP_BACKGROUND.dark,
            texto: "#F1F5F9",
            suave: "#94A3B8",
            caja: "rgba(255,255,255,0.08)",
          }
        : {
            fondo: APP_BACKGROUND.light,
            texto: "#101010",
            suave: "#828690",
            caja: "#F4F4F4",
          },
    [isDark],
  );
}

/** Estilos del módulo de búsqueda (no cambian con el tema: los colores van aparte) */
export const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  vacio: { paddingTop: 70, paddingBottom: 140 },
  lista: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center" },
  contenido: { paddingHorizontal: 16 },
  // Cabecera flotante y la neblina detrás
  cabecera: { position: "absolute", top: 0, left: 0, right: 0 },
  neblina: { position: "absolute", top: 0, left: 0, right: 0 },
  filaBuscador: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  circulo: {
    width: LADO_VOLVER,
    height: LADO_VOLVER,
    minHeight: LADO_VOLVER,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
  },
  pildora: { flex: 1 },
  // El input y, encima de él, las frases que rotan
  cajaEntrada: { flex: 1, minWidth: 0, alignSelf: "stretch" },
  // Sin padding vertical: la píldora mide lo mismo que la del inicio
  entrada: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  limpiar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  // Recientes e ideas
  tituloSeccion: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 10,
  },
  filaReciente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  recienteTexto: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  recienteIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reciente: { flex: 1, fontSize: 15, fontWeight: "400" },
  ideaTextos: { flex: 1, minWidth: 0, gap: 2 },
  ideaTitulo: { fontSize: 15, fontWeight: "400" },
  ideaDetalle: { fontSize: 13, fontWeight: "400" },
  seccionSiguiente: { marginTop: 22 },
  quitar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  // Resultados: dos publicaciones por fila, como en el inicio
  filaProductos: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 16,
    marginBottom: 16,
  },
});
