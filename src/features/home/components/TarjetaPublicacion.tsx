import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import {
  allowsProductRating,
  formatProductPrice,
} from "@/features/marketplace/rules";
import type { Product } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import {
  IconoCorazon,
  IconoCorazonRelleno,
  IconoEstrella,
} from "./IconosTarjeta";

const LADO_AVATAR = 36;
const COLOR_FAVORITO = "#F2143C";
const COLOR_ESTRELLA = "#F5A623";
const RADIO = 24;

/**
 * Tarjeta de una publicación del inicio: la foto cubre la parte de arriba de la card sin
 * marco y, encima de ella, la calificación (una estrella y su número) a la izquierda y el
 * corazón de favoritos a la derecha. Debajo, el título y, abajo, el precio y el avatar de
 * quien vende (al tocarlo se abre su perfil). Sin categoría ni descripción: la descripción
 * se ve al abrir la publicación.
 */
export const TarjetaPublicacion = memo(function TarjetaPublicacion({
  item,
  cardWidth,
  favorite,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
  acciones,
}: {
  item: Product;
  cardWidth: number;
  favorite: boolean;
  onOpen: (productId: string) => void;
  /** Recibe el uid de quien vende */
  onOpenSeller: (ownerId: string) => void;
  onToggleFavorite: (productId: string) => void;
  /** Si se pasa, va en lugar del avatar, el título y el precio (el perfil propio) */
  acciones?: ReactNode;
}) {
  const { isDark } = useAppTheme();
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);
  const conEstrella = allowsProductRating(item.category);
  const calificacion = (item.rating ?? 0).toFixed(1);
  const precio = formatProductPrice(item) ?? "Sin precio";

  const colorTexto = isDark ? "#F1F5F9" : "#101010";

  // El corazón da un brinco rápido: crece y vuelve, sin rebotar
  const escala = useSharedValue(1);
  const estiloCorazon = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));
  const alternarFavorito = () => {
    escala.set(
      withSequence(
        withTiming(1.3, { duration: 90 }),
        withTiming(1, { duration: 110 }),
      ),
    );
    onToggleFavorite(item.id);
  };

  return (
    // Capa externa: la sombra (si recortara, iOS la cortaría); la interna recorta la foto
    <View
      style={[
        estilos.sombra,
        {
          width: cardWidth,
          backgroundColor: isDark ? "#1B2230" : "#FFFFFF",
        },
      ]}
    >
      <View style={estilos.tarjeta}>
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.name}`}
            onPress={() => onOpen(item.id)}
          >
            <LinearGradient
              colors={PRODUCT_COLORS[item.category]}
              style={[estilos.foto, { height: Math.round(cardWidth * 0.74) }]}
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
          </Pressable>

          {/* Encima de la foto: calificación a la izquierda y corazón a la derecha */}
          <View pointerEvents="box-none" style={estilos.sobreFoto}>
            {conEstrella ? (
              <View
                accessible
                accessibilityLabel={`Calificación ${calificacion}`}
                style={estilos.calificacion}
              >
                <IconoEstrella size={17} color={COLOR_ESTRELLA} />
                <Text style={estilos.nota}>{calificacion}</Text>
              </View>
            ) : (
              <View />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? "Quitar de favoritos" : "Agregar a favoritos"
              }
              accessibilityState={{ selected: favorite }}
              onPress={alternarFavorito}
              hitSlop={10}
            >
              <Animated.View style={[estiloCorazon, estilos.sombraIcono]}>
                {favorite ? (
                  <IconoCorazonRelleno size={24} color={COLOR_FAVORITO} />
                ) : (
                  <IconoCorazon size={24} color="#FFFFFF" />
                )}
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {acciones ?? (
          <>
            {/* Avatar a la izquierda y, a su lado, el título con el precio debajo */}
            <View style={estilos.info}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${item.seller}`}
                onPress={() => onOpenSeller(item.ownerId)}
                hitSlop={6}
              >
                <AvatarVendedor
                  ownerId={item.ownerId}
                  fallbackName={item.seller}
                  size={LADO_AVATAR}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.name}`}
                onPress={() => onOpen(item.id)}
                style={estilos.textos}
              >
                <Text
                  numberOfLines={1}
                  style={[estilos.titulo, { color: colorTexto }]}
                >
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[estilos.precio, { color: colorTexto }]}
                >
                  {precio}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  sombra: {
    borderRadius: RADIO,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  tarjeta: { borderRadius: RADIO, overflow: "hidden" },
  foto: { alignItems: "center", justifyContent: "center" },
  sobreFoto: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calificacion: { flexDirection: "row", alignItems: "center", gap: 4 },
  nota: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Una sombra suave detrás del corazón para que se lea sobre cualquier foto
  sombraIcono: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  textos: { flex: 1, minWidth: 0, gap: 1 },
  titulo: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  precio: { fontFamily: "Inter_500Medium", fontSize: 13.5 },
});
