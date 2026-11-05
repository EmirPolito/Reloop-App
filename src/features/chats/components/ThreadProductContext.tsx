import { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import type { Product } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { THREAD_HEADER_HEIGHT } from "../threadLayout";

/** Tarjeta bajo el encabezado con la publicación de la que se está hablando. Toca para abrirla. */
export function ThreadProductContext({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const { isDark, styles } = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Ver publicación ${product.name}`}
      onPress={onPress}
      scaleTo={0.98}
      entering={FadeIn.duration(200)}
      style={[
        styles.productContext,
        {
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          // Justo debajo del encabezado flotante, que si no la tapa
          position: "absolute",
          top: THREAD_HEADER_HEIGHT,
          left: 0,
          right: 0,
          zIndex: 5,
        },
      ]}
    >
      <AppIcon
        name={PRODUCT_ICONS[product.category]}
        size={19}
        color="#0785FF"
      />
      <Text numberOfLines={1} style={styles.productContextText}>
        {product.name}
        {product.price > 0 ? ` · $${product.price}` : ""}
      </Text>
      <AppIcon
        name="chevronRight"
        size={17}
        color={isDark ? "#A9A5B7" : "#9CA1AA"}
      />
    </PressableScale>
  );
}
