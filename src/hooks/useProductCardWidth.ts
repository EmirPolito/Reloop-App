import { useWindowDimensions } from "react-native";

import {
  MAX_CONTENT_WIDTH,
  PRODUCT_GRID_SPACING,
} from "@/constants/layout";

/** Ancho de cada tarjeta en la cuadrícula de dos columnas de productos. */
export function useProductCardWidth(columns: 1 | 2 = 2): number {
  const { width } = useWindowDimensions();
  if (columns === 1) {
    return Math.min(width, MAX_CONTENT_WIDTH) - 32;
  }
  return (Math.min(width, MAX_CONTENT_WIDTH) - PRODUCT_GRID_SPACING) / 2;
}
