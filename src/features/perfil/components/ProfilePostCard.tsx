import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { categoryFor } from "@/features/marketplace/data";
import { productBadgeLabel } from "@/features/marketplace/rules";
import type { Product } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";

export interface ProfilePostCardProps {
  item: Product;
  cardWidth: number;
  isDark: boolean;
  onPress: () => void;
}

/** Alto de la foto según el ancho de la tarjeta */
export const profilePostImageHeight = (cardWidth: number) =>
  Math.round(cardWidth * 1.05);

/**
 * Tarjeta de una publicación del perfil (lista con scroll a los lados): la foto con
 * esquinas redondeadas y, debajo, el nombre, el precio (o la categoría) y la categoría.
 */
export const ProfilePostCard = memo(function ProfilePostCard({
  item,
  cardWidth,
  isDark,
  onPress,
}: ProfilePostCardProps) {
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const colorSuave = isDark ? "#94A3B8" : "#8A8A8F";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${item.name}`}
      onPress={onPress}
      style={{ width: cardWidth }}
    >
      <View
        style={{
          width: cardWidth,
          height: profilePostImageHeight(cardWidth),
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={PRODUCT_COLORS[item.category]}
          style={styles.relleno}
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
        </LinearGradient>
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={[styles.nombre, { color: colorTexto }]}>
          {item.name}
        </Text>
        <View style={styles.fila}>
          <Text style={[styles.precio, { color: colorTexto }]}>
            {productBadgeLabel(item)}
          </Text>
          <Text numberOfLines={1} style={[styles.categoria, { color: colorSuave }]}>
            {categoryFor(item.category).label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  relleno: { flex: 1, alignItems: "center", justifyContent: "center" },
  info: { paddingHorizontal: 6, paddingTop: 10, gap: 2 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  precio: { fontFamily: "Inter_700Bold", fontSize: 13.5 },
  categoria: { flexShrink: 1, fontFamily: "Inter_500Medium", fontSize: 12.5 },
});
