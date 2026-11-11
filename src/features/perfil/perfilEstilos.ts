import { StyleSheet } from "react-native";

import { APP_BACKGROUND } from "@/features/shared/constants";

/** Colores fijos de los iconos de las estadísticas */
export const COLOR_ICONO_PUBLICACIONES = "#ff3762ff";
export const COLOR_ICONO_SEGUIDORES = "#296ffaff";
export const COLOR_ICONO_REPUTACION = "#ffb638ff";

/** Alto de la portada (imagen de fondo), sin contar la barra de estado */
export const ALTO_PORTADA = 175;

/** Lado del avatar cuadrado redondeado */
export const LADO_AVATAR = 87;

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
    paddingHorizontal: 15,
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
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 30,
  },
  /* Inter: la fuente libre más parecida a las de X, Instagram o Facebook.
     Cada grosor es un archivo; fontWeight se ignora (ver Text.tsx) */
  profileName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18.5,
    letterSpacing: -1,
    lineHeight: 34,
    includeFontPadding: false,
  },

  tagsRow: {
    marginTop: 0.5,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7.5,
  },

  profileSubtitle: {
    fontFamily: "Inter_400Regular",
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },

  /* Estadísticas: una sola tarjeta con 3 columnas separadas por divisores */
  /* Sin fondo: los 3 datos en una línea, repartidos de orilla a orilla */
  statsContainer: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 2,
    paddingVertical: 5,
    marginBottom: -10,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3.53 },
  // Número en negrita y texto ligero gris, mismo tamaño (estilo X / Instagram)
  statValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 13 },

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
