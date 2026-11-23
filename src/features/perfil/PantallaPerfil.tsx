import { StyleSheet, View } from "react-native";
import { useSeguidores } from "./hooks/useSeguidores";
import { IconoEditar } from "./iconosPerfil";
import { useProfile } from "./ProveedorPerfil";

import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useNavegacion } from "@/features/navigation/useNavegacion";

import { TarjetaPremium } from "@/features/premium/components/TarjetaPremium";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { BotonHeaderPerfil } from "./2-barra-superior";
import { AjustesPerfil } from "./5-ajustes";
import { VistaPerfil } from "./VistaPerfil";

/**
 * Perfil propio: portada que colapsa en header, avatar, nombre con la insignia Premium,
 * @username y publicaciones. Debajo de las publicaciones: el banner de ReLoop Premium y,
 * después, General, Legal y Cerrar sesión. Editar perfil está arriba a la derecha.
 */
export function PantallaPerfil() {
  const { isDark } = useAppTheme();
  const { profile } = useProfile();
  const { uid } = useSessionUser();
  const { products: mine, status: mineStatus } = useUserProducts(uid);
  const { followersCount } = useSeguidores(uid);
  const { openProduct, openEditProfile, openPremium, openFollows } =
    useNavegacion();
  const premium = useIsPremium(uid);

  return (
    <VistaPerfil
      profile={profile}
      isDark={isDark}
      placeholder="icono"
      premium={premium}
      derecha={
        <BotonHeaderPerfil etiqueta="Editar perfil" onPress={openEditProfile}>
          <IconoEditar size={18} color="#FFFFFF" />
        </BotonHeaderPerfil>
      }
      stats={{
        publicaciones: mine.length,
        seguidores: followersCount,
        reputacion: averageRatingLabel(mine),
      }}
      onSeguidores={() => openFollows(uid)}
      publicaciones={{
        items: mine,
        status: mineStatus,
        isOwn: true,
        onOpen: openProduct,
      }}
      pie={
        <>
          <View style={styles.premium}>
            <TarjetaPremium
              activa={premium}
              isDark={isDark}
              onPress={openPremium}
            />
          </View>
          <AjustesPerfil isDark={isDark} />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  // Mismo margen lateral que las tarjetas de General y Legal, y la separación entre tarjetas
  // Más separado de las publicaciones
  premium: { paddingHorizontal: 15, marginTop: 108 },
});
