import { useSessionUser } from "@/features/session/SessionUserProvider";
import type { Product } from "@/features/marketplace/types";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { usePerfilDe } from "../hooks/usePerfilDe";
import { defaultProfile } from "../mapeoPerfil";
import { TarjetaVendedor } from "./TarjetaVendedor";

/**
 * La tarjeta de vendedor en el inicio y en favoritos: busca el perfil de quien publica (su
 * nombre, avatar y el diseño que eligió) y, mientras llega, usa el nombre de sus publicaciones.
 * En la propia, "Personalizar tarjeta" lleva al perfil, donde se edita.
 */
export function TarjetaVendedorDe({
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
  const { uid } = useSessionUser();
  const { navigate } = useNavegacion();
  const perfil = usePerfilDe(ownerId);
  return (
    <TarjetaVendedor
      items={products}
      profile={perfil ?? defaultProfile(products[0]?.seller ?? "Usuario")}
      ownerId={ownerId}
      isOwn={ownerId === uid}
      isDark={isDark}
      onOpen={onOpen}
      onPersonalizar={() => navigate("profile")}
    />
  );
}
