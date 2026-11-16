import { memo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { Product } from "@/features/marketplace/types";
import { ProfilePostCard } from "./ProfilePostCard";

/** Parte del ancho que ocupa cada tarjeta (se asoma la siguiente para invitar a deslizar) */
const PROPORCION_TARJETA = 0.5;
const SEPARACION = 14;

/**
 * Publicaciones del perfil, una al lado de otra con scroll a los lados. Cada tarjeta lleva su
 * foto y su información, y el scroll se detiene en cada una.
 */
export const ListaPublicaciones = memo(function ListaPublicaciones({
  items,
  isDark,
  onOpen,
}: {
  items: Product[];
  isDark: boolean;
  onOpen: (productId: string) => void;
}) {
  const [ancho, setAncho] = useState(0);
  const cardWidth = Math.round(ancho * PROPORCION_TARJETA);

  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {ancho > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={cardWidth + SEPARACION}
          contentContainerStyle={styles.contenido}
        >
          {items.map((item) => (
            <ProfilePostCard
              key={item.id}
              item={item}
              cardWidth={cardWidth}
              isDark={isDark}
              onPress={() => onOpen(item.id)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  contenido: { gap: SEPARACION, paddingBottom: 12 },
});
