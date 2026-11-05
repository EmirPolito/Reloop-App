import type { TextStyle, ViewStyle } from "react-native";

/**
 * Lo único que distingue visualmente a la pantalla de acceso de la de registro.
 * Todo lo demás (estructura y estilos) es común y vive en AuthCarouselLayout.
 */
export interface AuthLayoutVariant {
  /** Alineación del contenedor raíz. */
  root: ViewStyle;
  /** Posición de la imagen central. */
  centerImage: ViewStyle;
  /** Tamaño de las imágenes flotantes dentro de su caja. */
  imageSize: "100%" | "110%";
  /** Color de relleno de la sombra de suelo. */
  floorShadowFill: string;
  /**
   * Sombra de la tarjeta inferior. Debe llevar todas sus propiedades `shadow*`
   * juntas: en web se compilan por objeto y repartirlas cambia el resultado.
   */
  drawerShadow: ViewStyle;
  /** Espaciado del subtítulo. */
  subtitle: TextStyle;
}

export const LOGIN_VARIANT: AuthLayoutVariant = {
  root: { justifyContent: "space-between" },
  centerImage: { top: 50, left: 95 },
  imageSize: "100%",
  floorShadowFill: "rgba(15, 23, 42, 0.024)",
  drawerShadow: { shadowColor: "#ffffffff", shadowOpacity: 1 },
  subtitle: { lineHeight: 19, marginTop: 6, paddingHorizontal: 6 },
};

export const REGISTER_VARIANT: AuthLayoutVariant = {
  root: { alignItems: "center" },
  centerImage: { top: 80, left: 100 },
  imageSize: "110%",
  floorShadowFill: "#13131307",
  drawerShadow: {
    shadowColor: "#ffffffff",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  subtitle: { lineHeight: 18, marginTop: 5, paddingHorizontal: 5 },
};
