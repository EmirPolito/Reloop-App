import { useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Disolvible, type Disolvedor } from "@/components/ui/Disolvible";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { TarjetaPublicacion } from "@/features/home/components/TarjetaPublicacion";
import type { Product } from "@/features/marketplace/types";
import { CapaSeleccion } from "./CapaSeleccion";
import { IconoCorazonVacio } from "./components/IconoCorazonVacio";
import { TarjetaVendedorFavorita } from "./TarjetaVendedorFavorita";

/** Las tarjetas de vendedor guardadas van primero; las publicaciones sueltas, de dos en dos */
export type Bloque =
  | { type: "seller"; ownerId: string }
  | { type: "products"; products: Product[] };

/** En la selección, las tarjetas de vendedor llevan este prefijo (para no confundirse con una publicación) */
export const PREFIJO_VENDEDOR = "v:";

const SEPARACION = 16;
/** Esquinas de la tarjeta de una publicación (las de TarjetaPublicacion) */
const RADIO_PUBLICACION = 22;

const claveBloque = (bloque: Bloque) =>
  bloque.type === "seller"
    ? `seller-${bloque.ownerId}`
    : `products-${bloque.products[0].id}`;

/**
 * La lista de favoritos: primero las tarjetas de vendedor guardadas y luego las publicaciones
 * de dos en dos, con la misma tarjeta del inicio. Cada tarjeta se registra para el efecto de
 * volar al bote; en selección, una capa encima la marca o desmarca.
 */
export function ListaFavoritos({
  bloques,
  cardWidth,
  isDark,
  seleccionando,
  marcados,
  registrar,
  contenido,
  alHacerScroll,
  onAlternar,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
  vacio,
}: {
  bloques: Bloque[];
  cardWidth: number;
  isDark: boolean;
  seleccionando: boolean;
  marcados: ReadonlySet<string>;
  registrar: (id: string, disolvedor: Disolvedor | null) => void;
  /** Rellenos de la lista: empieza bajo el encabezado y termina sobre el nav */
  contenido: StyleProp<ViewStyle>;
  alHacerScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onAlternar: (id: string) => void;
  onOpen: (productId: string) => void;
  onOpenSeller: (uid: string) => void;
  onToggleFavorite: (productId: string) => void;
  /** Título y mensaje cuando no hay nada que mostrar */
  vacio: { titulo: string; mensaje: string };
}) {
  const renderBloque = useCallback(
    ({ item: bloque }: { item: Bloque }) =>
      bloque.type === "seller" ? (
        <TarjetaVendedorFavorita
          ownerId={bloque.ownerId}
          isDark={isDark}
          onOpen={onOpen}
          separacion={SEPARACION}
          registrar={registrar}
          seleccionando={seleccionando}
          marcada={marcados.has(PREFIJO_VENDEDOR + bloque.ownerId)}
          onAlternar={() => onAlternar(PREFIJO_VENDEDOR + bloque.ownerId)}
        />
      ) : (
        <View style={estilos.fila}>
          {bloque.products.map((item) => (
            <Disolvible
              key={item.id}
              id={item.id}
              registrar={registrar}
              sombra={14}
              margenInferior={SEPARACION}
            >
              {/* La capa de selección cubre solo la tarjeta, no el relleno de la sombra */}
              <View>
                <TarjetaPublicacion
                  item={item}
                  cardWidth={cardWidth}
                  favorite
                  onOpen={onOpen}
                  onOpenSeller={onOpenSeller}
                  onToggleFavorite={onToggleFavorite}
                />
                {seleccionando ? (
                  <CapaSeleccion
                    radio={RADIO_PUBLICACION}
                    etiqueta={`Seleccionar ${item.name}`}
                    marcada={marcados.has(item.id)}
                    onPress={() => onAlternar(item.id)}
                  />
                ) : null}
              </View>
            </Disolvible>
          ))}
        </View>
      ),
    [
      isDark,
      onOpen,
      registrar,
      seleccionando,
      marcados,
      onAlternar,
      cardWidth,
      onOpenSeller,
      onToggleFavorite,
    ],
  );

  return (
    <FlatList
      onScroll={alHacerScroll}
      scrollEventThrottle={16}
      data={bloques}
      extraData={marcados}
      keyExtractor={claveBloque}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={contenido}
      renderItem={renderBloque}
      ListEmptyComponent={
        <IllustratedEmptyState
          icon={<IconoCorazonVacio size={80} />}
          title={vacio.titulo}
          message={vacio.mensaje}
          style={estilos.vacio}
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  // Dos publicaciones sueltas lado a lado
  fila: { flexDirection: "row", gap: SEPARACION },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
