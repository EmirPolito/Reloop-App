import { StyleSheet } from "react-native";
import { MEDIDAS, RADIO } from "./drawerTheme";

/* ========================================================================== */
/*  Estilos: SOLO layout (colores y tipografía viven en PALETA / TIPO)        */
/* ========================================================================== */

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { width: "100%", height: "100%" },
  centrado: { alignItems: "center", justifyContent: "center" },

  /* Encabezado */
  header: {
    height: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    position: "absolute",
    top: 0,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 15,
    zIndex: 20,
    elevation: 0,
    borderWidth: 0,
    shadowOpacity: 0,
  },

  /* gap = separación idéntica entre todas las secciones */
  content: {
    paddingHorizontal: 15,
    paddingTop: 10,
    gap: MEDIDAS.gapSecciones,
  },

  /* Avatar */
  avatarWrap: { alignItems: "center", gap: 7 },
  avatar: {
    width: MEDIDAS.avatar,
    height: MEDIDAS.avatar,
    borderRadius: MEDIDAS.avatar / 2,
    overflow: "hidden",
    marginBottom: 5,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Inputs nombre / descripción */
  inputsGroup: { gap: 12 },
  campo: { borderRadius: RADIO, overflow: "hidden" },
  contadorUna: {
    position: "absolute",
    top: 0,
    right: 12,
    height: MEDIDAS.altoInput,
    justifyContent: "center",
    zIndex: 1,
  },
  contadorMulti: {
    position: "absolute",
    top: 0,
    right: 12,
    height: MEDIDAS.altoInput,
    justifyContent: "center",
    zIndex: 1,
  },

  /* h-11: una línea, centrada, sin lineHeight => cursor y placeholder alineados */
  inputUna: {
    height: MEDIDAS.altoInput,
    paddingHorizontal: MEDIDAS.padH,
    paddingRight: 52,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  /* h-15: varias líneas, desde arriba, con padding vertical simétrico */
  inputMulti: {
    minHeight: MEDIDAS.altoDescripcion,
    paddingHorizontal: MEDIDAS.padH,
    paddingRight: 52,
    paddingTop: 15,
    paddingBottom: 15,
    lineHeight: 18,
    textAlignVertical: "top",
    includeFontPadding: false,
  },

  /* Tarjetas */
  card: { borderRadius: RADIO, padding: MEDIDAS.padTarjeta },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: { lineHeight: 15, marginTop: 3, marginBottom: 14 },

  /* Scroll horizontal que llega a los bordes de la tarjeta */
  hScroll: { marginHorizontal: -MEDIDAS.padTarjeta },
  hContent: { paddingHorizontal: MEDIDAS.padTarjeta, gap: 8 },

  /* Etiquetas */
  tagInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagField: {
    flex: 1,
    height: MEDIDAS.altoInput,
    borderRadius: RADIO,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: MEDIDAS.padH,
    gap: 10,
  },
  tagInput: {
    flex: 1,
    height: "100%",
    padding: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  tagAdd: {
    width: MEDIDAS.altoInput,
    height: MEDIDAS.altoInput,
    borderRadius: RADIO,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRow: { flexDirection: "row", gap: 8 },
  iconCell: {
    height: MEDIDAS.celdaIcono,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tagPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADIO,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginTop: 12,
  },
  tagPalette: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 },
  tagPaletteDot: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tagAcciones: { flexDirection: "row", gap: 8, marginLeft: 10 },
  tagBoton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Stickers (padding arriba/derecha para que la insignia no se recorte) */
  stickersContent: {
    paddingHorizontal: MEDIDAS.padTarjeta,
    paddingTop: 6,
    paddingRight: 21,
    gap: 10,
  },
  stickerCell: {
    width: MEDIDAS.celdaSticker,
    height: MEDIDAS.celdaSticker,
    borderRadius: RADIO,
    alignItems: "center",
    justifyContent: "center",
  },
  stickerImage: { width: "66%", height: "66%" },
  stickerBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Acciones */
  actions: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    height: MEDIDAS.altoBoton,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
