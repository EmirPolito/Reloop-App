import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";

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

/** Separación entre las tarjetas (a los lados y entre filas) */
const SEPARACION = 14;

/**
 * Publicaciones del perfil una por una, de dos en dos. En el perfil propio cada tarjeta lleva
 * solo la imagen y debajo los botones de republicar, editar (abre un drawer) y eliminar (pide
 * confirmar); cada acción avisa arriba al terminar. En el de otra persona, la tarjeta normal
 * sin encabezado (ya se sabe de quién es).
 */
export const ListaPublicaciones = memo(function ListaPublicaciones({
  items,
  isOwn,
  onOpen,
}: {
  items: Product[];
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

  const cardWidth = Math.floor((ancho - SEPARACION) / 2);

  const eliminar = async () => {
    if (!porEliminar || eliminando) return;
    const producto = porEliminar;
    setEliminando(true);
    try {
      await deleteProduct(producto.id);
      setPorEliminar(null);
      mostrar({
        tipo: "eliminada",
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
      {cardWidth > 0 ? (
        <View style={styles.cuadricula}>
          {items.map((item) => (
            <TarjetaPublicacion
              key={item.id}
              item={item}
              cardWidth={cardWidth}
              sinEncabezado
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
        </View>
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
  // Dos por fila: la tarjeta mide la mitad del ancho menos la separación
  cuadricula: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SEPARACION,
  },
});
