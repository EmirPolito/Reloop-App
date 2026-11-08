import { StyleSheet } from "react-native";

/** Colores fijos de los iconos de las 3 tarjetas (no dependen del color de fondo del perfil) */
export const COLOR_ICONO_PUBLICACIONES = "#858585ff";
export const COLOR_ICONO_SEGUIDORES = "#858585ff";
export const COLOR_ICONO_REPUTACION = "#ffb638ff";

/** Separación entre lo de arriba y las 3 tarjetas de estadísticas */
export const MARGEN_STATS = 22;

/** Colores de las tarjetas según el tema (estadísticas, ajustes y acciones) */
export function coloresTarjeta(isDark: boolean) {
  return {
    fondoTarjeta: isDark ? "#1E293B" : "#ffffffff",
    texto: isDark ? "#F1F5F9" : "#101010",
    textoFila: isDark ? "#CBD5E1" : "#424242ff",
    flecha: isDark ? "#8391A7" : "#424242ff",
  };
}

/** Estilos compartidos por el perfil propio y el perfil público */
export const estilosPerfil = StyleSheet.create({
  headerContainer: {
    height: 220,
    width: "100%",
    position: "relative",
    zIndex: 20,
  },
  skyBackground: {
    flex: 1,
    paddingTop: 11.5,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,

    // Brillo de las letras
    textShadowColor: "#ffffff81",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  avatarContainer: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    zIndex: 10,
  },
  avatarRing: {
    width: 145,
    height: 145,
    borderRadius: 150,
    padding: 5.5,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  /* minHeight = una línea: si el nombre llega un instante después, no cambia el alto */
  profileName: {
    top: 2,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 25,
    minHeight: 25,
    includeFontPadding: false,
  },
  profileSubtitle: {
    paddingHorizontal: 15,
    marginTop: 5.5,
    fontSize: 12.5,
    color: "#929292ff",
    fontWeight: "400",
    textAlign: "center",
  },
  profileInfoSection: {
    paddingHorizontal: 15,
    alignItems: "center",
    paddingTop: 65,
    paddingBottom: 20,
  },

  /* El marginTop va en línea (cambia según haya o no etiquetas) */
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 9,
  },

  // 3 tarjetas: Publicaciones, Seguidores, Reputación
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 15,
    gap: 2,
    elevation: 0.2,
  },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#848484ff", fontWeight: "500" },

  // Tarjeta de una sola acción (cerrar sesión, enviar mensaje)
  tarjetaAccion: {
    marginTop: 19,
    height: 60,
    borderRadius: 17,
    paddingHorizontal: 12.5,
    gap: 9,
    elevation: 0.2,
    flexDirection: "row",
    alignItems: "center",
  },
  tarjetaAccionTexto: { flex: 1, fontSize: 14, fontWeight: "500" },
});
