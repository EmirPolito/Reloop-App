import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Animated, Pressable, View } from "react-native";

import type { Product } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";

export interface ProfilePostCardProps {
  item: Product;
  cardWidth: number;
  onPress: () => void;
  /** Opacidad del precio (el carrusel solo lo muestra en la tarjeta central). */
  priceOpacity?:
    | Animated.AnimatedInterpolation<number>
    | Animated.Value
    | number;
}

/** Alto de la tarjeta según su ancho (lo usa también el carrusel). */
export const profilePostCardHeight = (cardWidth: number) =>
  Math.min(240, Math.max(150, cardWidth * 1.2));

/**
 * Tarjeta SOLO para las publicaciones del perfil (carrusel en abanico):
 * imagen con borde blanco, sombra suave abajo y precio arriba a la izquierda.
 * Sin botón de corazón. La tarjeta del inicio sigue siendo `ProductCard`.
 */
export const ProfilePostCard = memo(function ProfilePostCard({
  item,
  cardWidth,
  onPress,
  priceOpacity = 1,
}: ProfilePostCardProps) {
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);
  const height = profilePostCardHeight(cardWidth);

  // Ajusta `item.price` al campo real de tu tipo Product.
  const priceLabel = `$${Number(item.price ?? 0).toLocaleString("es-MX")}`;

  return (
    // Capa externa: lleva la sombra (si tuviera overflow-hidden, iOS la recorta).
    <View
      style={{
        width: cardWidth,
        height,
        borderRadius: 35,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000000",
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      {/* Capa interna: borde blanco + recorte de esquinas */}
      <View className="flex-1 overflow-hidden rounded-3xl border-3 border-white bg-white">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${item.name}`}
          onPress={onPress}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={PRODUCT_COLORS[item.category]}
            style={{ flex: 1 }}
            className="items-center justify-center"
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            ) : (
              <AppIcon
                name={PRODUCT_ICONS[item.category]}
                size={30}
                color="#FFFFFF"
              />
            )}
          </LinearGradient>
        </Pressable>

        {/* Precio arriba a la izquierda (solo visible en la tarjeta central) */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            opacity: priceOpacity,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text className="text-xs font-bold text-neutral-900">
            {priceLabel}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
});
