import { Pressable, View } from "react-native";

import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Título de la sección ("Cerca de ti" o la categoría activa) con "Ver todo". */
export function SectionTitle({
  activeCategory,
  onClearCategory,
}: {
  activeCategory: CategoryId | null;
  onClearCategory: () => void;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {activeCategory ? categoryFor(activeCategory).label : "Cerca de ti"}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onClearCategory}
        style={styles.rowAction}
      >
        <Text style={styles.seeAll}>Ver todo</Text>
      </Pressable>
    </View>
  );
}
