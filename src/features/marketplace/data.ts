import type { CategoryId } from "./types";

export const CATEGORIES: {
  id: CategoryId;
  label: string;
  color: string;
}[] = [
  { id: "venta", label: "Ventas", color: "#A3D94E" },
  { id: "cambio", label: "Intercambios", color: "#13A8D9" },
  { id: "donacion", label: "Donaciones", color: "#F44350" },
  { id: "mascota", label: "Adopciones", color: "#F45AA3" },
  { id: "comida", label: "Comidas", color: "#F5A332" },
];

export function categoryFor(id: CategoryId) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0];
}
