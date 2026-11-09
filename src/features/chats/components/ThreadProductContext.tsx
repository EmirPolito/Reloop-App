import { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import type { Product } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { THREAD_PRODUCT_CARD_Z, useThreadHeaderHeight } from "../threadLayout";

/** Tarjeta bajo el encabezado con la publicación de la que se está hablando. Toca para abrirla. */
export function ThreadProductContext({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const { isDark, styles } = useAppTheme();
  const headerHeight = useThreadHeaderHeight();

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
          // Justo debajo del encabezado flotante
          position: "absolute",
          top: headerHeight,
          left: 0,
          right: 0,
          zIndex: THREAD_PRODUCT_CARD_Z,
          // Menor que el header (100) pero mayor que las burbujas
          elevation: THREAD_PRODUCT_CARD_Z,
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
