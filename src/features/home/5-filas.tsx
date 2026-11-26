import { createContext, memo, useContext, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { BulkSearchIcon } from "@/features/chats/components/IconosChats";
import type { CategoryId, Product } from "@/features/marketplace/types";
import { universidadPorId } from "@/features/marketplace/universidades";
import { TarjetaVendedorDe } from "@/features/perfil/components/TarjetaVendedorDe";
import { TarjetaPublicacion } from "./components/TarjetaPublicacion";
import { useEstilosInicio } from "./estilos";

/**
 * Las filas de la lista del inicio. Están memorizadas: al cambiar la categoría, un favorito o
 * cualquier otra cosa, solo se vuelve a dibujar la fila que cambió (antes se redibujaban todas
 * las de la pantalla, con sus fotos e iconos, y por eso se alentaba).
 */

/**
 * Transición al cambiar de categoría (1 = a la vista): las publicaciones se desvanecen y bajan
 * un poco, se aplica el filtro y el contenido nuevo sube suave a su lugar. Solo transform y
 * opacidad, en el hilo de UI; en reposo no hay nada que actualizar.
 */
export const TransicionFiltroContext =
  createContext<SharedValue<number> | null>(null);
/** Lo que bajan las publicaciones al salir (y desde donde suben al entrar) */
const DESPLAZAMIENTO_FILTRO = 14;

/** Envuelve una parte de la lista que sale y entra al filtrar */
export function ConTransicionFiltro({ children }: { children: ReactNode }) {
  const filtro = useContext(TransicionFiltroContext);
  const estilo = useAnimatedStyle(() => {
    const v = filtro ? filtro.get() : 1;
    return {
      opacity: v,
      transform: [{ translateY: (1 - v) * DESPLAZAMIENTO_FILTRO }],
    };
  });
  return <Animated.View style={estilo}>{children}</Animated.View>;
}

/** Las mismas publicaciones, en el mismo orden (aunque la lista sea otra) */
function mismasPublicaciones(a: Product[], b: Product[]) {
  return a.length === b.length && a.every((p, i) => p === b[i]);
}

/** Dos publicaciones sueltas lado a lado (o una y un hueco del mismo ancho) */
export const FilaPublicaciones = memo(
  function FilaPublicaciones({
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
    onOpenSeller: (ownerId: string) => void;
    onToggleFavorite: (productId: string) => void;
  }) {
    const estilos = useEstilosInicio();
    return (
      <ConTransicionFiltro>
        <View style={estilos.filaPublicaciones}>
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
          {products.length === 1 ? <View style={{ width: cardWidth }} /> : null}
        </View>
      </ConTransicionFiltro>
    );
  },
  // Se redibuja solo si cambian sus publicaciones o si alguna entra o sale de favoritos
  (antes, ahora) =>
    antes.cardWidth === ahora.cardWidth &&
    antes.onOpen === ahora.onOpen &&
    antes.onOpenSeller === ahora.onOpenSeller &&
    antes.onToggleFavorite === ahora.onToggleFavorite &&
    mismasPublicaciones(antes.products, ahora.products) &&
    ahora.products.every(
      (p) => antes.favoritos.has(p.id) === ahora.favoritos.has(p.id),
    ),
);

/** La tarjeta grande de quien tiene insignia y 3 o más publicaciones */
export const FilaVendedor = memo(
  function FilaVendedor({
    ownerId,
    products,
    isDark,
    onOpen,
  }: {
    ownerId: string;
    products: Product[];
    isDark: boolean;
    onOpen: (productId: string) => void;
  }) {
    const estilos = useEstilosInicio();
    return (
      <ConTransicionFiltro>
        <View style={estilos.filaVendedor}>
          <TarjetaVendedorDe
            ownerId={ownerId}
            products={products}
            isDark={isDark}
            onOpen={onOpen}
          />
        </View>
      </ConTransicionFiltro>
    );
  },
  (antes, ahora) =>
    antes.ownerId === ahora.ownerId &&
    antes.isDark === ahora.isDark &&
    antes.onOpen === ahora.onOpen &&
    mismasPublicaciones(antes.products, ahora.products),
);

/** Sin publicaciones: el mensaje depende de la universidad, la búsqueda y la categoría */
export const AvisoSinPublicaciones = memo(function AvisoSinPublicaciones({
  universidad,
  sinComunidad,
  query,
  activeCategory,
}: {
  universidad: string;
  /** Una universidad que todavía no tiene comunidad en la app */
  sinComunidad: boolean;
  query: string;
  activeCategory: CategoryId | null;
}) {
  const filtrando = Boolean(query || activeCategory);
  return (
    <ConTransicionFiltro>
      {/* Sin tarjeta, con la misma ilustración que la búsqueda cuando no encuentra nada */}
      <IllustratedEmptyState
        icon={<BulkSearchIcon size={80} />}
        conInter
        style={estilosVacio.vacio}
        title={
          sinComunidad
            ? `Aún no hay publicaciones en ${universidadPorId(universidad).sigla}`
            : filtrando
              ? "No encontramos publicaciones"
              : "Tu comunidad empieza aquí"
        }
        message={
          sinComunidad
            ? "Cuando la comunidad de esa universidad empiece a publicar, las verás aquí."
            : filtrando
              ? "Prueba con otra búsqueda o categoría."
              : "Sé la primera persona en publicar. Comparte algo con la comunidad UTSV."
        }
      />
    </ConTransicionFiltro>
  );
});

/** No se pudieron cargar: el aviso y el botón de reintentar */
export const AvisoError = memo(function AvisoError({
  onReintentar,
}: {
  onReintentar: () => void;
}) {
  return (
    <View>
      <EmptyState
        title="No pudimos cargar las publicaciones"
        message="Revisa tu conexión e inténtalo de nuevo."
        icon="search"
      />
      <PrimaryButton label="Reintentar" onPress={onReintentar} />
    </View>
  );
});

const estilosVacio = StyleSheet.create({
  // Debajo del banner y las categorías: menos aire arriba que en la búsqueda
  vacio: { paddingTop: 48, paddingBottom: 80 },
});
