import { StyleSheet } from "react-native";

/** Estilos compartidos por las pantallas de acceso y registro. */
export const authStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ECEEF2", // Fondo gris/blanco suave
  },

  // ── SECCIÓN SUPERIOR CON LAS 3 IMÁGENES FLOTANTES ──────────────────────────
  topSection: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingGroup: {
    width: 335,
    height: 210,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  floorShadowContainer: {
    position: "absolute",
    bottom: -4,
    left: 25,
    width: 260,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingImageWrapper: {
    position: "absolute",
    width: 125,
    height: 125,
    justifyContent: "center",
    alignItems: "center",
  },
  centerImagePos: {
    zIndex: 10,
  },
  leftImagePos: {
    zIndex: 4,
    left: 6,
    top: -4,
  },
  rightImagePos: {
    zIndex: 5,
    right: 6,
    top: 10,
  },

  // ── CARD INFERIOR TIPO DRAWER BLANCO (LARGA, PLANA ABAJO, POCO ESPACIO LADOS)
  bottomWrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 0,
    zIndex: 20,
  },
  drawerCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 25,
    elevation: 8,
  },
  drawerScrollContent: {
    alignItems: "center",
  },

  // ── TIPOGRAFÍA Y TEXTOS ───────────────────────────────────────────────────
  // Los dos siguientes son Animated.Text (no pasan por el Text de la app): llevan su fuente aquí
  slideTitle: {
    fontFamily: "Poppins_700Bold",
    fontWeight: "normal",
    includeFontPadding: false,
    fontSize: 25,
    color: "#000000ff",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  slideSubtitle: {
    fontFamily: "Poppins_400Regular",
    includeFontPadding: false,
    fontSize: 13.5,
    color: "#6B7280",
    textAlign: "center",
  },

  // ── PUNTOS DEL CARRUSEL ───────────────────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 12,
    marginBottom: 16,
  },
  dotsRowSingle: {
    marginTop: 0,
    marginBottom: 6,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 15,
    backgroundColor: "#000000ff",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#E5E7EB",
  },

  // ── BOTONES LARGOS (Google, Apple, Email) ───────────────────────────────────
  primaryPillButton: {
    width: "100%",
    height: 50,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },

  // 1. Negro (Google y envío del formulario)
  googleButton: {
    backgroundColor: "#181A1F",
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // 3. Email (Blanco con borde)
  emailButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#181A1F",
  },

  // ── MODO FORMULARIO EMAIL ─────────────────────────────────────────────────
  emailFormContainer: {
    width: "100%",
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    height: 52,
    paddingHorizontal: 16,
  },
  inputFieldIcon: {
    marginRight: 10,
  },
  textInputField: {
    flex: 1,
    height: "100%",
    fontSize: 14.5,
    color: "#111827",
  },
  togglePassword: {
    paddingRight: 4,
  },
  togglePasswordText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
  },
  authError: {
    fontSize: 13,
    color: "#DC2626",
    textAlign: "center",
  },
  authNotice: {
    fontSize: 13,
    color: "#2563EB",
    textAlign: "center",
  },
  submitButton: {
    marginTop: 4,
  },

  // ── FOOTER ────────────────────────────────────────────────────────────────
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },
  footerText: {
    fontSize: 13.5,
    color: "#6B7280",
  },
  footerLink: {
    fontSize: 13.5,
    color: "#181A1F",
    fontWeight: "700",
  },
});
