import { View } from "react-native";

import { Disolvible, type Disolvedor } from "@/components/ui/Disolvible";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { TarjetaVendedorDe } from "@/features/perfil/components/TarjetaVendedorDe";
import { CapaSeleccion } from "./CapaSeleccion";

/**
 * Una tarjeta de vendedor guardada en favoritos: con todas las publicaciones que esa persona
 * tiene ahora. Si ya no tiene ninguna, no se dibuja. En selección, tocarla la marca.
 */
export function TarjetaVendedorFavorita({
  ownerId,
  isDark,
  onOpen,
  seleccionando,
  marcada,
  onAlternar,
  separacion,
  registrar,
}: {
  ownerId: string;
  isDark: boolean;
  onOpen: (productId: string) => void;
  seleccionando: boolean;
  marcada: boolean;
  onAlternar: () => void;
  separacion: number;
  /** La pantalla guarda cómo disolver esta tarjeta al quitarla (efecto Stream) */
  registrar?: (id: string, disolvedor: Disolvedor | null) => void;
}) {
  const { products } = useUserProducts(ownerId);
  if (products.length === 0) return null;
  return (
    <Disolvible
      // En la selección, las tarjetas de vendedor llevan el prefijo "v:"
      id={`v:${ownerId}`}
      registrar={registrar}
      sombra={14}
      margenInferior={separacion}
    >
      {/* La capa de selección cubre solo la tarjeta, no el relleno de la sombra */}
      <View>
        <TarjetaVendedorDe
          ownerId={ownerId}
          products={products}
          isDark={isDark}
          onOpen={onOpen}
        />
        {seleccionando ? (
          <CapaSeleccion
            radio={26}
            etiqueta={`Seleccionar la tarjeta de ${products[0].seller}`}
            marcada={marcada}
            onPress={onAlternar}
          />
        ) : null}
      </View>
    </Disolvible>
  );
}
