import { memo, useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  FiltrosPildoras,
  type OpcionFiltro,
} from "@/components/ui/FiltrosPildoras";
import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";

/** Todas (sin filtro) o una categoría */
type Filtro = "todas" | CategoryId;

/** Margen de la lista del inicio a cada lado */
const MARGEN_LISTA = 16;

/** Las mismas píldoras que favoritos: Todas, Comidas y luego las demás */
const OPCIONES: OpcionFiltro<Filtro>[] = [
  { id: "todas", texto: "Todas" },
  ...(["comida", "donacion", "cambio", "venta", "mascota"] as const).map(
    (id) => ({ id, texto: categoryFor(id).label }),
  ),
];

/** Categorías del inicio en píldoras como las de favoritos (se deslizan de lado); tocar una la activa, volver a tocarla o tocar Todas la quita. */
export const CategoriasInicio = memo(function CategoriasInicio({
  activeCategory,
  onToggleCategory,
}: {
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
}) {
  // La elegida se marca en el mismo toque (estado propio) y el filtro, que vuelve a dibujar
  // todo el inicio, se aplica un cuadro después: así el toque responde al instante.
  // Si la categoría cambia desde otro lado (las píldoras, limpiar filtros), se sigue a esa
  const [elegida, setElegida] = useState(activeCategory);
  const [activaAntes, setActivaAntes] = useState(activeCategory);
  if (activaAntes !== activeCategory) {
    setActivaAntes(activeCategory);
    setElegida(activeCategory);
  }
  const alCambiar = useCallback(
    (id: Filtro) => {
      // Todas quita la categoría elegida (si hay); otra la activa o, si ya lo estaba, la quita
      const categoria = id === "todas" ? elegida : id;
      if (categoria === null) return;
      setElegida((actual) => (actual === categoria ? null : categoria));
      // Marcada en el mismo toque; el filtro lo aplica la pantalla con su transición
      onToggleCategory(categoria);
    },
    [elegida, onToggleCategory],
  );

  return (
    // Hasta las orillas de la pantalla: las píldoras ya traen su margen a los lados
    <View style={styles.contenedor}>
      <FiltrosPildoras
        opciones={OPCIONES}
        activo={elegida ?? "todas"}
        onCambiar={alCambiar}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  // Las píldoras traen 20 arriba y 16 abajo: quedan a unos 18 del título y a 30 de las
  // publicaciones
  contenedor: {
    marginTop: -14,
    marginBottom: 14,
    marginHorizontal: -MARGEN_LISTA,
  },
});
