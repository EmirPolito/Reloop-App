import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Banner de bienvenida y título de la sección ("Cerca de ti" o la categoría activa). */
export function FeedIntro({
  activeCategory,
  onClearCategory,
}: {
  activeCategory: CategoryId | null;
  onClearCategory: () => void;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={styles.feedHeader}>
      <View
        accessibilityLabel="Banner de bienvenida de ReLoop"
        style={styles.promoCard}
      >
        <Image
          source={require("@/assets/images/1er-banner.png")}
          contentFit="cover"
          style={styles.bannerImage}
        />
      </View>
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
    </View>
  );
}
