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
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import {
  IconoCorazon,
  IconoCorazonRelleno,
  IconoEstrella,
} from "./IconosTarjeta";

const COLOR_FAVORITO = "#F2143C";
const COLOR_ESTRELLA = "#F5A623";
const RADIO = 24;

function formatPublicationTime(createdAt: number): string {
  if (!createdAt) return "Hoy";
  const elapsed = Math.max(0, Date.now() - createdAt);
  const days = Math.floor(elapsed / 86400000);
  if (days < 1) return "Hoy";
  if (days === 1) return "Hace 1 día";
  return `Hace ${days} días`;
}

/**
 * Tarjeta de publicación: encabezado del vendedor, foto cuadrada y pie con nombre,
 * precio y puntuación. En tarjetas angostas reduce tipografía y controles.
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
  const perfil = usePerfilDe(item.ownerId);
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);
  const conEstrella = allowsProductRating(item.category);
  const calificacion = (item.rating ?? 0).toFixed(1);
  const mostrarPrecioYRanking =
    item.category !== "cambio" &&
    item.category !== "donacion" &&
    item.category !== "mascota";
  const precio = formatProductPrice(item);
  const nombreUsuario = perfil?.name ?? item.seller;
  const compacta = cardWidth < 260;
  const ladoAvatar = compacta ? 32 : 44;
  const radioCorazon = compacta ? 20 : 25;

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
        <View style={[
          estilos.encabezado,
          { height: compacta ? 54 : 64 },
          compacta && estilos.encabezadoCompacto,
        ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${nombreUsuario}`}
            onPress={() => onOpenSeller(item.ownerId)}
            hitSlop={6}
          >
            <AvatarVendedor
              ownerId={item.ownerId}
              fallbackName={nombreUsuario}
              size={ladoAvatar}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.name}`}
            onPress={() => onOpen(item.id)}
            style={estilos.usuario}
          >
            <Text numberOfLines={1} style={[
              compacta ? estilos.nombreUsuarioCompacto : estilos.nombreUsuario,
              { color: colorTexto },
            ]}>
              {nombreUsuario}
            </Text>
            <Text numberOfLines={1} style={[
              compacta ? estilos.tiempoCompacto : estilos.tiempo,
            ]}>
              {formatPublicationTime(item.createdAt)}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            accessibilityState={{ selected: favorite }}
            onPress={alternarFavorito}
            hitSlop={10}
            style={estilos.favorito}
          >
            <Animated.View style={estiloCorazon}>
              {favorite ? (
                <IconoCorazonRelleno size={radioCorazon} color={COLOR_FAVORITO} />
              ) : (
                <IconoCorazon size={radioCorazon} color={isDark ? "#F1F5F9" : "#101010"} />
              )}
            </Animated.View>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${item.name}`}
          onPress={() => onOpen(item.id)}
        >
          <LinearGradient
            colors={PRODUCT_COLORS[item.category]}
            style={[estilos.foto, { height: Math.round(cardWidth) }]}
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
                size={34}
                color="#FFFFFF"
              />
            )}
          </LinearGradient>
          <View style={estilos.disponibles}>
            <Text style={estilos.disponiblesTexto}>
              {item.availableQuantity}{" "}
              {item.availableQuantity === 1 ? "Disponible" : "Disponibles"}
            </Text>
          </View>
        </Pressable>

        {acciones ? (
          <View style={estilos.acciones}>{acciones}</View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.name}`}
            onPress={() => onOpen(item.id)}
            style={[
              estilos.pie,
              compacta && estilos.pieCompacto,
            ]}
          >
            <Text numberOfLines={1} style={[
              compacta ? estilos.tituloCompacto : estilos.titulo,
              { color: colorTexto },
            ]}>
              {item.name}
            </Text>
            {mostrarPrecioYRanking ? (
              <View style={estilos.pieInferior}>
                {precio ? (
                  <Text numberOfLines={1} style={[
                    compacta ? estilos.precioCompacto : estilos.precio,
                    { color: colorTexto },
                  ]}>
                    {precio}
                  </Text>
                ) : (
                  <View />
                )}
                {conEstrella ? (
                  <View
                    accessible
                    accessibilityLabel={`Calificación ${calificacion}`}
                    style={estilos.calificacion}
                  >
                    <IconoEstrella size={compacta ? 16 : 21} color={COLOR_ESTRELLA} />
                    <Text style={[
                      compacta ? estilos.notaCompacta : estilos.nota,
                      { color: colorTexto },
                    ]}>
                      {calificacion}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </Pressable>
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
  encabezado: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  encabezadoCompacto: {
    paddingHorizontal: 6,
  },
  usuario: { flex: 1, minWidth: 0, marginLeft: 6 },
  nombreUsuario: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  nombreUsuarioCompacto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  tiempo: {
    marginTop: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#6B7280",
  },
  tiempoCompacto: {
    marginTop: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: "#6B7280",
  },
  favorito: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  foto: { alignItems: "center", justifyContent: "center" },
  disponibles: {
    position: "absolute",
    right: 10,
    bottom: 10,
    minHeight: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  disponiblesTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#111111",
  },
  pie: { paddingHorizontal: 12, paddingTop: 9, paddingBottom: 11 },
  pieCompacto: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 7 },
  pieInferior: {
    minHeight: 28,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  calificacion: { flexDirection: "row", alignItems: "center", gap: 3 },
  nota: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  notaCompacta: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  titulo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  tituloCompacto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  precio: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  precioCompacto: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  acciones: { paddingHorizontal: 12, paddingBottom: 10 },
});
