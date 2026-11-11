import { StyleSheet } from "react-native";

import { APP_BACKGROUND } from "@/features/shared/constants";

/** Colores fijos de los iconos de las estadísticas */
export const COLOR_ICONO_PUBLICACIONES = "#545454ff";
export const COLOR_ICONO_SEGUIDORES = "#545454ff";
export const COLOR_ICONO_REPUTACION = "#ffb638ff";

/** Alto de la portada (imagen de fondo), sin contar la barra de estado */
export const ALTO_PORTADA = 175;

/** Lado del avatar cuadrado redondeado */
export const LADO_AVATAR = 90;

/** Cuánto sube el avatar sobre la portada */
export const SOLAPE_AVATAR = 47;

/** Fondo de la pantalla del perfil (gris tipo Apple en claro) */
export function fondoPerfil(isDark: boolean) {
  return isDark ? APP_BACKGROUND.dark : APP_BACKGROUND.light;
}

/** Colores de las tarjetas según el tema (estadísticas, ajustes y acciones) */
export function coloresTarjeta(isDark: boolean) {
  return {
    fondoTarjeta: isDark ? "#1E293B" : "#fefefeff",
    texto: isDark ? "#F1F5F9" : "#101010",
    textoFila: isDark ? "#CBD5E1" : "#424242ff",
    flecha: isDark ? "#8391A7" : "#424242ff",
    suave: isDark ? "#94A3B8" : "#8a8a8aff",
    divisor: isDark ? "#334155" : "#E5E5EA",
  };
}

/** Estilos compartidos por el perfil propio y el perfil público */
export const estilosPerfil = StyleSheet.create({
  /* Fila del avatar (izquierda) y la acción (derecha), montada sobre la portada */
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -SOLAPE_AVATAR,
    zIndex: 20,
  },
  avatarMarco: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: 27,
    padding: 3,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Nombre, etiquetas y descripción: alineados a la izquierda */
  profileInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 1,
    paddingBottom: 30,
  },
  /* Inter: la fuente libre más parecida a las de X, Instagram o Facebook.
     Cada grosor es un archivo; fontWeight se ignora (ver Text.tsx) */
  profileName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    letterSpacing: -1,
    lineHeight: 34,
    includeFontPadding: false,
  },
  profileSubtitle: {
    fontFamily: "Inter_400Regular",
    marginTop: -1.5,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  tagsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7.5,
  },

  /* Estadísticas: una sola tarjeta con 3 columnas separadas por divisores */
  /* Sin fondo: las 3 columnas se reparten de orilla a orilla, con los divisores al centro */
  statsContainer: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  statColumna: { alignItems: "center", gap: 3 },
  statDivisor: { width: StyleSheet.hairlineWidth * 2, height: 30 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { fontSize: 17, fontWeight: "600" },
  statLabel: { fontSize: 11.5, fontWeight: "500" },

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
