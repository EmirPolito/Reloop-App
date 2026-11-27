import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  IconoCorazon,
  IconoCorazonRelleno,
} from "@/features/home/components/IconosTarjeta";
import { IconoEstrellaDetalle } from "@/features/marketplace/components/IconosDetalle";
import { categoryFor } from "@/features/marketplace/data";
import {
  allowsProductRating,
  formatProductPrice,
} from "@/features/marketplace/rules";
import type { Product } from "@/features/marketplace/types";
import { INTER } from "@/features/perfil/editar/editarTema";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";

const AMARILLO = "#FFB800";
const COLOR_FAVORITO = "#F2143C";

/** Cinco estrellas amarillas (las que no alcanza, en gris) y, al lado, cuántas reseñas */
function EstrellasCompactas({
  valor,
  resenas,
  apagada,
  suave,
}: {
  valor: number;
  resenas: number;
  apagada: string;
  suave: string;
}) {
  const llenas = Math.round(valor);
  return (
    <View
      accessibilityLabel={`${valor.toFixed(1)} de 5 estrellas, ${resenas} reseñas`}
      style={styles.estrellas}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <IconoEstrellaDetalle
          key={n}
          size={13}
          color={n <= llenas ? AMARILLO : apagada}
        />
      ))}
      <Text style={[INTER.regular, styles.resenas, { color: suave }]}>
        ({resenas})
      </Text>
    </View>
  );
}

/**
 * Publicación destacada en la búsqueda: la foto en un cuadro claro con el corazón abajo a la
 * derecha; debajo, el nombre, las estrellas con cuántas reseñas tiene y el precio.
 */
export const TarjetaDestacada = memo(function TarjetaDestacada({
  item,
  ancho,
  favorito,
  onOpen,
  onToggleFavorite,
}: {
  item: Product;
  ancho: number;
  favorito: boolean;
  onOpen: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}) {
  const { isDark } = useAppTheme();
  const foto = optimizedImageUrl(item.imageUri, ancho * 2);
  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#6B6B70";
  const precio = formatProductPrice(item) ?? categoryFor(item.category).label;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${item.name}`}
      onPress={() => onOpen(item.id)}
      style={{ width: ancho }}
    >
      <View
        style={[
          styles.foto,
          { height: ancho, backgroundColor: isDark ? "#1E1E22" : "#F2F2F4" },
        ]}
      >
        {foto ? (
          <Image
            source={{ uri: foto }}
            contentFit="cover"
            cachePolicy="memory-disk"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <AppIcon
            name={PRODUCT_ICONS[item.category]}
            size={34}
            color={suave}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorito ? "Quitar de favoritos" : "Agregar a favoritos"
          }
          accessibilityState={{ selected: favorito }}
          onPress={() => onToggleFavorite(item.id)}
          hitSlop={8}
          style={styles.corazon}
        >
          {favorito ? (
            <IconoCorazonRelleno size={18} color={COLOR_FAVORITO} />
          ) : (
            <IconoCorazon size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <View style={styles.textos}>
        <Text
          numberOfLines={1}
          style={[INTER.semibold, styles.nombre, { color: texto }]}
        >
          {item.name}
        </Text>
        {allowsProductRating(item.category) ? (
          <EstrellasCompactas
            valor={item.rating ?? 0}
            resenas={item.reviewCount}
            apagada={isDark ? "#4A4A4A" : "#D4D4D4"}
            suave={suave}
          />
        ) : null}
        <Text
          numberOfLines={1}
          style={[INTER.medium, styles.precio, { color: texto }]}
        >
          {precio}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  foto: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  corazon: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { paddingTop: 8, paddingHorizontal: 2, gap: 2 },
  nombre: { fontSize: 14 },
  estrellas: { flexDirection: "row", alignItems: "center", gap: 1 },
  resenas: { fontSize: 12, marginLeft: 3 },
  precio: { fontSize: 13.5, marginTop: 1 },
});
