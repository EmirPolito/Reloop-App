import { StyleSheet, View } from "react-native";
import { useFollowers } from "./hooks/useFollowers";
import { IconoEditar } from "./Perfiliconos";
import { useProfile } from "./ProfileProvider";

import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";

import { TarjetaPremium } from "@/features/premium/components/TarjetaPremium";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { showComingSoonAlert } from "@/utils/alerts";
import { AjustesPerfil } from "./components/AjustesPerfil";
import {
  BotonHeaderPerfil,
  PerfilDesplazable,
} from "./components/PerfilDesplazable";

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
  const { followersCount } = useFollowers(uid);
  const { openProduct, openEditProfile } = useAppNavigation();
  const premium = useIsPremium(uid);

  return (
    <PerfilDesplazable
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
      publicaciones={{
        items: mine,
        status: mineStatus,
        isOwn: true,
        onOpen: openProduct,
      }}
      pie={
        <>
          <View style={styles.premium}>
            {/* La pantalla de ReLoop Premium llega con la fase de pagos y promociones */}
            <TarjetaPremium
              activa={premium}
              isDark={isDark}
              onPress={() => showComingSoonAlert("ReLoop Premium")}
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
  premium: { paddingHorizontal: 15, marginTop: 21 },
});
