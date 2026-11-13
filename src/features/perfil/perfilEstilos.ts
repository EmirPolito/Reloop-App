import { StyleSheet } from "react-native";

import { APP_BACKGROUND } from "@/features/shared/constants";

/** Lado del avatar redondo */
export const LADO_AVATAR = 90;

/** Fondo de la pantalla del perfil (gris tipo Apple en claro) */
export function fondoPerfil(isDark: boolean) {
  return isDark ? APP_BACKGROUND.dark : APP_BACKGROUND.light;
}

/** Colores de las tarjetas según el tema (ajustes y acciones) */
export function coloresTarjeta(isDark: boolean) {
  return {
    fondoTarjeta: isDark ? "#8d8d8d0e" : "#fefefeff",
    texto: isDark ? "#f1f5f947" : "#101010",
    textoFila: isDark ? "#CBD5E1" : "#424242ff",
    flecha: isDark ? "#8391A7" : "#424242ff",
    suave: isDark ? "#94A3B8" : "#8a8a8aff",
    divisor: isDark ? "#334155" : "#E5E5EA",
  };
}

/** Estilos compartidos por el perfil propio y el perfil público */
export const estilosPerfil = StyleSheet.create({
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: LADO_AVATAR / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tarjeta de una sola acción (cerrar sesión, enviar mensaje)
  tarjetaAccion: {
    marginTop: 19,
    height: 60,
    borderRadius: 17,
    paddingHorizontal: 10,
    gap: 10,
    elevation: 0.4,
    flexDirection: "row",
    alignItems: "center",
  },
  tarjetaAccionTexto: { flex: 1, fontSize: 14, fontWeight: "500" },
});
