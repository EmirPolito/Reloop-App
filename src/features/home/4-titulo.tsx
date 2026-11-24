import { memo } from "react";
import { View } from "react-native";

import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { Text } from "@/features/shared/Text";
import { ConTransicionFiltro } from "./5-filas";
import { useEstilosInicio } from "./estilos";

/**
 * Título de la lista: "Todas las publicaciones" o, con una categoría activa, "Filtrada por
 * ventas" (y así con las demás), y a la derecha cuántas publicaciones se muestran.
 */
export const TituloSeccion = memo(function TituloSeccion({
  activeCategory,
  count,
}: {
  activeCategory: CategoryId | null;
  /** `null` mientras cargan las publicaciones */
  count: number | null;
}) {
  const estilos = useEstilosInicio();
  return (
    <ConTransicionFiltro>
      <View style={estilos.encabezadoSeccion}>
        <Text
          numberOfLines={1}
          style={[
            estilos.tituloSeccion,
            {
              flexShrink: 1,
              fontFamily: "Inter_600SemiBold",
              fontWeight: "600",
            },
          ]}
        >
          {activeCategory
            ? `Filtrada por ${categoryFor(activeCategory).label.toLowerCase()}`
            : "Todas las publicaciones"}
        </Text>
        {count !== null ? (
          <Text
            accessibilityLabel={`${count} publicaciones`}
            style={[
              estilos.tituloSeccion,
              {
                fontFamily: "Inter_400Regular",
                fontWeight: "400",
                fontSize: 15.5,
                marginRight: 4,
                opacity: 0.55,
              },
            ]}
          >
            {count}
          </Text>
        ) : null}
      </View>
    </ConTransicionFiltro>
  );
});
