import { useWindowDimensions } from "react-native";

import {
  MAX_CONTENT_WIDTH,
  PRODUCT_GRID_SPACING,
} from "@/constants/layout";

/** Ancho de cada tarjeta en la cuadrícula de dos columnas de productos. */
export function useProductCardWidth(): number {
  const { width } = useWindowDimensions();
  return (Math.min(width, MAX_CONTENT_WIDTH) - PRODUCT_GRID_SPACING) / 2;
}
