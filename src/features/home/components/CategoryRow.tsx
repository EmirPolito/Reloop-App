import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { CATEGORY_IMAGES } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";

const CategoryControl = memo(function CategoryControl({
  category,
  selected,
  onToggle,
}: {
  category: (typeof CATEGORIES)[number];
  selected: boolean;
  onToggle: (category: CategoryId) => void;
}) {
  const { styles } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.label}
      onPress={() => onToggle(category.id)}
      style={styles.categoryItem}
    >
      <View
        style={[
          styles.categoryCircle,
          selected && styles.categoryCircleSelected,
        ]}
      >
        <Image
          source={CATEGORY_IMAGES[category.id]}
          contentFit="contain"
          style={styles.categoryImage}
        />
      </View>
      <Text numberOfLines={1} style={styles.categoryItemLabel}>
        {category.label}
      </Text>
    </Pressable>
  );
});

/** Fila fija de categorías; tocar una la activa y volver a tocarla la desactiva. */
export function CategoryRow({
  activeCategory,
  onToggleCategory,
}: {
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={styles.categoryStickyRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryList}
      >
        {CATEGORIES.map((category) => (
          <CategoryControl
            key={category.id}
            category={category}
            selected={activeCategory === category.id}
            onToggle={onToggleCategory}
          />
        ))}
      </ScrollView>
    </View>
  );
}
