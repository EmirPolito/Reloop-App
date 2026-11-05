import { ScrollView, StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { BackHeader } from "@/components/ui/BackHeader";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { PerfilCabecera } from "./components/PerfilCabecera";
import { PerfilInformacion } from "./components/PerfilInformacion";
import { StickersFlotantes } from "./components/StickersFlotantes";
import { TarjetaAccion } from "./components/TarjetaAccion";
import { usePublicProfile } from "./hooks/usePublicProfile";
import { IconoMensaje, IconoPublicaciones } from "./Perfiliconos";
import { coloresTarjeta, estilosPerfil } from "./perfilEstilos";
import { defaultProfile } from "./profileMappers";

/** Todavía no hay seguidores: el número es fijo. */
const SEGUIDORES = "0";

/** Perfil de otra persona (o el propio, visto como lo ven las demás), con el mismo estilo del perfil propio. */
export function PantallaPerfilPublico({ userId }: { userId: string }) {
  const { styles: baseStyles, isDark } = useAppTheme();
  const { uid } = useSessionUser();
  const { profile: storedProfile, status } = usePublicProfile(userId);
  const { products: userProducts, status: productsStatus } =
    useUserProducts(userId);
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { back, openProduct } = useAppNavigation();
  const openChat = useOpenChat();
  const cardWidth = useProductCardWidth();

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);

  if (status === "loading") {
    return (
      <View style={baseStyles.fill}>
        <BackHeader title="Perfil" onBack={back} />
        <LoadingState />
      </View>
    );
  }

  // Sin ficha de perfil (o si no se pudo leer) se muestra lo que se sabe de la persona
  const profile =
    storedProfile ?? defaultProfile(userProducts[0]?.seller ?? "Usuario");

  return (
    <ScrollView
      style={baseStyles.screenScroll}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <PerfilCabecera
        color={profile.color}
        isDark={isDark}
        nav={
          <>
            <PressableSuave
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={back}
              style={styles.backBtn}
            >
              <AppIcon name="back" size={22} color="#FFFFFF" />
            </PressableSuave>
            <Text style={estilosPerfil.headerTitle}>Perfil</Text>
            <View style={styles.backBtn} />
          </>
        }
        avatar={
          <PerfilAvatar
            photo={profile.photo}
            color={profile.color}
            name={profile.name}
            placeholder="iniciales"
          />
        }
      >
        <StickersFlotantes stickers={profile.stickers} />
      </PerfilCabecera>

      <PerfilInformacion
        profile={profile}
        stats={{
          publicaciones: String(userProducts.length),
          seguidores: SEGUIDORES,
          reputacion: averageRatingLabel(userProducts),
        }}
        isDark={isDark}
      />

      <View style={{ paddingHorizontal: 15 }}>
        {userProducts.length ? (
          <View style={baseStyles.profilePostGrid}>
            {userProducts.map((product) => (
              <ProductCard
                key={product.id}
                item={product}
                cardWidth={cardWidth}
                favorite={favorites.includes(product.id)}
                onOpen={openProduct}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </View>
        ) : productsStatus === "loading" ? (
          <LoadingState />
        ) : (
          <IllustratedEmptyState
            icon={
              <IconoPublicaciones
                size={80}
                color={isDark ? "#475569" : "#C5CAD3"}
              />
            }
            title="Aún no hay publicaciones"
            message="Las publicaciones de esta persona aparecerán aquí."
            style={{ paddingTop: 60, paddingBottom: 80 }}
          />
        )}

        {userId !== uid ? (
          <TarjetaAccion
            icon={<IconoMensaje size={25} color="#0062ff75" />}
            label="Enviar mensaje"
            labelColor={textoFila}
            backgroundColor={fondoTarjeta}
            arrowColor={flecha}
            accessibilityLabel={`Enviar mensaje a ${profile.name}`}
            onPress={() => openChat({ id: userId, name: profile.name })}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
