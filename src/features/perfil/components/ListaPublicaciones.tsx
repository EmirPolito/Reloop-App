import { memo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import { AccionesPublicacion } from "@/features/marketplace/components/AccionesPublicacion";
import { ConfirmarEliminar } from "@/features/marketplace/components/ConfirmarEliminar";
import { SheetEditarPublicacion } from "@/features/marketplace/components/SheetEditarPublicacion";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { deleteProduct } from "@/features/marketplace/productRepository";
import type { Product } from "@/features/marketplace/types";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { describeFirestoreError } from "@/lib/firestoreValues";

/** Parte del ancho que ocupa cada tarjeta (se asoma la siguiente para invitar a deslizar) */
const PROPORCION_TARJETA = 0.5;
const SEPARACION = 14;

/**
 * Publicaciones del perfil, una al lado de otra con scroll a los lados y con la misma tarjeta
 * del inicio. En el perfil de otra persona se ve la tarjeta normal (avatar, título y precio).
 * En el propio, en lugar de eso salen los botones de republicar, editar (abre un drawer) y
 * eliminar (pide confirmar), y cada acción avisa arriba cuando termina.
 */
export const ListaPublicaciones = memo(function ListaPublicaciones({
  items,
  isDark,
  isOwn,
  onOpen,
}: {
  items: Product[];
  isDark: boolean;
  isOwn: boolean;
  onOpen: (productId: string) => void;
}) {
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { openUserProfile } = useAppNavigation();
  const { mostrar } = useAvisos();
  const [ancho, setAncho] = useState(0);
  const [editando, setEditando] = useState<Product | null>(null);
  const [porEliminar, setPorEliminar] = useState<Product | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const cardWidth = Math.round(ancho * PROPORCION_TARJETA);

  const eliminar = async () => {
    if (!porEliminar || eliminando) return;
    const producto = porEliminar;
    setEliminando(true);
    try {
      await deleteProduct(producto.id);
      setPorEliminar(null);
      mostrar({
        tipo: "exito",
        titulo: "Publicación eliminada",
        descripcion: `"${producto.name}" se eliminó correctamente.`,
      });
    } catch (error) {
      setPorEliminar(null);
      mostrar({
        tipo: "error",
        titulo: "No se pudo eliminar",
        descripcion: describeFirestoreError(error),
      });
    } finally {
      setEliminando(false);
    }
  };

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
            <TarjetaPublicacion
              key={item.id}
              item={item}
              cardWidth={cardWidth}
              favorite={favorites.includes(item.id)}
              onOpen={onOpen}
              onOpenSeller={openUserProfile}
              onToggleFavorite={toggleFavorite}
              acciones={
                isOwn ? (
                  <AccionesPublicacion
                    item={item}
                    onEditar={setEditando}
                    onEliminar={setPorEliminar}
                  />
                ) : undefined
              }
            />
          ))}
        </ScrollView>
      ) : null}

      {isOwn ? (
        <>
          <SheetEditarPublicacion
            producto={editando}
            onClose={() => setEditando(null)}
          />
          <ConfirmarEliminar
            producto={porEliminar}
            eliminando={eliminando}
            onCancelar={() => setPorEliminar(null)}
            onConfirmar={() => void eliminar()}
          />
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  // Espacio abajo para que la sombra de las tarjetas no se corte
  contenido: { gap: SEPARACION, paddingBottom: 14, paddingHorizontal: 2 },
});
