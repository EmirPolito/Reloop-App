import { View } from "react-native";

import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Título de la lista: "Todas las publicaciones" o, con una categoría activa, "Filtrada por
 * ventas" (y así con las demás), y a la derecha cuántas publicaciones se muestran.
 */
export function SectionTitle({
  activeCategory,
  count,
}: {
  activeCategory: CategoryId | null;
  /** `null` mientras cargan las publicaciones */
  count: number | null;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={[styles.sectionHeader, { marginTop: 42 }]}>
      <Text
        numberOfLines={1}
        style={[
          styles.sectionTitle,
          { flexShrink: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600" },
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
            styles.sectionTitle,
            { fontFamily: "Inter_500Medium", fontWeight: "500", opacity: 0.55 },
          ]}
        >
          {count}
        </Text>
      ) : null}
    </View>
  );
}
