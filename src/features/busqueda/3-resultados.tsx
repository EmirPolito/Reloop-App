import { memo, useCallback } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  type useAnimatedScrollHandler,
} from "react-native-reanimated";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { BulkSearchIcon } from "@/features/chats/components/IconosChats";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import type { Product } from "@/features/marketplace/types";
import { estilos } from "./estilos";

/** Fila de dos publicaciones (la cuadrícula del inicio) */
export type FilaResultados = { key: string; products: Product[] };

/** Las publicaciones de dos en dos */
export function enFilas(products: Product[]): FilaResultados[] {
  const filas: FilaResultados[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const par = products.slice(i, i + 2);
    filas.push({ key: par.map((p) => p.id).join(":"), products: par });
  }
  return filas;
}

function claveFila(fila: FilaResultados) {
  return fila.key;
}

/**
 * Una fila de resultados. Memorizada: al escribir solo se redibujan las filas que cambian, y
 * marcar un favorito solo redibuja la fila de esa publicación.
 */
const FilaProductos = memo(
  function FilaProductos({
    products,
    cardWidth,
    favoritos,
    onOpen,
    onOpenSeller,
    onToggleFavorite,
  }: {
    products: Product[];
    cardWidth: number;
    favoritos: ReadonlySet<string>;
    onOpen: (productId: string) => void;
    onOpenSeller: (uid: string) => void;
    onToggleFavorite: (productId: string) => void;
  }) {
    return (
      <View style={estilos.filaProductos}>
        {products.map((product) => (
          <TarjetaPublicacion
            key={product.id}
            item={product}
            cardWidth={cardWidth}
            favorite={favoritos.has(product.id)}
            onOpen={onOpen}
            onOpenSeller={onOpenSeller}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </View>
    );
  },
  (antes, ahora) =>
    antes.cardWidth === ahora.cardWidth &&
    antes.onOpen === ahora.onOpen &&
    antes.onOpenSeller === ahora.onOpenSeller &&
    antes.onToggleFavorite === ahora.onToggleFavorite &&
    antes.products.length === ahora.products.length &&
    antes.products.every((p, i) => p === ahora.products[i]) &&
    ahora.products.every(
      (p) => antes.favoritos.has(p.id) === ahora.favoritos.has(p.id),
    ),
);

/** Resultados en vivo con la tarjeta de publicación del inicio, de dos en dos */
export const VistaResultados = memo(function VistaResultados({
  filas,
  cardWidth,
  favoritos,
  contenido,
  alHacerScroll,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
}: {
  filas: FilaResultados[];
  cardWidth: number;
  favoritos: ReadonlySet<string>;
  contenido: StyleProp<ViewStyle>;
  alHacerScroll: ReturnType<typeof useAnimatedScrollHandler>;
  onOpen: (productId: string) => void;
  onOpenSeller: (uid: string) => void;
  onToggleFavorite: (productId: string) => void;
}) {
  const renderFila = useCallback(
    ({ item }: { item: FilaResultados }) => (
      <FilaProductos
        products={item.products}
        cardWidth={cardWidth}
        favoritos={favoritos}
        onOpen={onOpen}
        onOpenSeller={onOpenSeller}
        onToggleFavorite={onToggleFavorite}
      />
    ),
    [cardWidth, favoritos, onOpen, onOpenSeller, onToggleFavorite],
  );

  return (
    <Animated.FlatList
      style={estilos.lista}
      contentContainerStyle={contenido}
      onScroll={alHacerScroll}
      scrollEventThrottle={16}
      data={filas}
      keyExtractor={claveFila}
      renderItem={renderFila}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={7}
      ListEmptyComponent={
        // Sin tarjeta, como en chats y favoritos
        <IllustratedEmptyState
          icon={<BulkSearchIcon size={80} />}
          title="No encontramos publicaciones"
          message="Prueba con otra palabra o quita el filtro de categoría."
          conInter
          style={estilos.vacio}
        />
      }
    />
  );
});
