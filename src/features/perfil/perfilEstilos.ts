import { StyleSheet } from "react-native";

import { APP_BACKGROUND } from "@/features/shared/constants";

/** Colores fijos de los iconos de las estadísticas */
export const COLOR_ICONO_PUBLICACIONES = "#ff3762ff";
export const COLOR_ICONO_SEGUIDORES = "#296ffaff";
export const COLOR_ICONO_REPUTACION = "#ffb638ff";

/** Alto de la portada (imagen de fondo), sin contar la barra de estado */
export const ALTO_PORTADA = 190;

/** Espacio sobre el avatar (además de la barra de estado), igual en el perfil propio y el público */
export const ESPACIO_SUPERIOR_PERFIL = 90;

/** Lado del avatar redondo */
export const LADO_AVATAR = 90;

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
  /* Fila del avatar (izquierda) y la acción (derecha), arriba del nombre */
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 13,
  },
  avatarMarco: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: LADO_AVATAR / 2,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Nombre, etiquetas y descripción: alineados a la izquierda */
  profileInfoSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 30,
  },
  /* Inter: la fuente libre más parecida a las de X, Instagram o Facebook.
      Cada grosor es un archivo; fontWeight se ignora (ver Text.tsx) */
  /* Fila del nombre: el nombre a la izquierda y, opcional, una acción (Seguir) a la derecha */
  filaNombre: {
    top: -9,
    marginTop: 15,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileName: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 26,
    letterSpacing: -0.9,
    lineHeight: 32,
    includeFontPadding: false,
  },

  profileSubtitle: {
    fontFamily: "Inter_400Regular",
    marginTop: -14,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
  },

  tagsRow: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  /* Estadísticas: una sola tarjeta con 3 columnas separadas por divisores */
  statsContainer: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    marginBottom: -10,
  },
  // Cada columna: texto arriba en gris y número grande abajo
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 28 },
  statValue: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12 },

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
