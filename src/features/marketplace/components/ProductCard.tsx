import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { categoryFor } from "../data";
import { allowsProductRating, productBadgeLabel } from "../rules";
import type { Product } from "../types";

const LADO_AVATAR_VENDEDOR = 24;

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
  // Avatar y nombre actuales de quien vende (la publicación solo guarda una copia del nombre)
  const seller = usePerfilDe(item.ownerId);
  const sellerName = seller?.name ?? item.seller;
  const sellerPremium = useIsPremium(item.ownerId);

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
          accessibilityLabel={`Ver perfil de ${sellerName}`}
          onPress={() => onOpenSeller?.(item.ownerId)}
          style={local.vendedor}
        >
          <UserAvatar
            photo={seller?.photo ?? null}
            orb={seller?.orb ?? null}
            name={sellerName}
            size={LADO_AVATAR_VENDEDOR}
            premium={sellerPremium}
          />
          <Text
            numberOfLines={1}
            style={[styles.productSellerLink, local.vendedorNombre]}
          >
            {sellerName}
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

const local = StyleSheet.create({
  vendedor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  // El avatar ya da el espacio de arriba
  vendedorNombre: { flexShrink: 1, marginTop: 0 },
});
