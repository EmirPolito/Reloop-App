import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { categoryFor } from "../data";
import { allowsProductRating, productBadgeLabel } from "../rules";
import type { Product } from "../types";

export interface ProductCardProps {
  item: Product;
  cardWidth: number;
  favorite: boolean;
  onOpen: (productId: string) => void;
  /** Recibe el uid de quien vende. */
  onOpenSeller?: (ownerId: string) => void;
  /** Sin este callback no se muestra el corazón. */
  onToggleFavorite?: (productId: string) => void;
}

/** Tarjeta de producto de las cuadrículas (inicio, favoritos y perfiles). */
export const ProductCard = memo(function ProductCard({
  item,
  cardWidth,
  favorite,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
}: ProductCardProps) {
  const { styles } = useAppTheme();
  const category = categoryFor(item.category);
  const shownRating = (item.rating ?? 0).toFixed(1);
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);

  return (
    <View style={[styles.productCard, { width: cardWidth }]}>
      <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
        <LinearGradient
          colors={PRODUCT_COLORS[item.category]}
          style={[
            styles.productImage,
            { height: Math.min(172, Math.max(116, cardWidth * 0.7)) },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <AppIcon
              name={PRODUCT_ICONS[item.category]}
              size={30}
              color="#FFFFFF"
            />
          )}
          <View
            style={[styles.categoryBadge, { backgroundColor: category.color }]}
          >
            <Text style={styles.categoryBadgeText}>
              {productBadgeLabel(item)}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
      <View style={styles.productInfo}>
        <Pressable accessibilityRole="button" onPress={() => onOpen(item.id)}>
          <Text numberOfLines={1} style={styles.productName}>
            {item.name}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${item.seller}`}
          onPress={() => onOpenSeller?.(item.ownerId)}
        >
          <Text numberOfLines={1} style={styles.productSellerLink}>
            {item.seller}
          </Text>
        </Pressable>
        <View style={styles.productMetaRow}>
          <Text numberOfLines={1} style={styles.productMeta}>
            {category.label}
          </Text>
          {allowsProductRating(item.category) ? (
            <Text
              accessibilityLabel={`Calificación de producto ${shownRating}`}
              style={styles.rating}
            >
              ★ {shownRating}
            </Text>
          ) : null}
        </View>
      </View>
      {onToggleFavorite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
          onPress={() => onToggleFavorite(item.id)}
          style={styles.favoriteButton}
        >
          <AppIcon
            name="favorite"
            size={16}
            color={favorite ? "#FF386B" : "#9298A3"}
          />
        </Pressable>
      ) : null}
    </View>
  );
});
