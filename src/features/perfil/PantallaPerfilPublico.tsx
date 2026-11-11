import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableSuave } from "@/components/PressableSuave";
import { BackHeader } from "@/components/ui/BackHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { coloresTarjeta, fondoPerfil } from "@/features/perfil/perfilEstilos";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { BotonSeguir } from "./components/BotonSeguir";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { PerfilCabecera } from "./components/PerfilCabecera";
import { PerfilInformacion } from "./components/PerfilInformacion";
import { PerfilPortada } from "./components/PerfilPortada";
import {
  PublicacionesPerfil,
  SIN_ANUNCIOS,
} from "./components/PublicacionesPerfil";
import { TarjetaAccion } from "./components/TarjetaAccion";
import { useFollowers } from "./hooks/useFollowers";
import { usePublicProfile } from "./hooks/usePublicProfile";
import { IconoMensaje } from "./Perfiliconos";
import { defaultProfile } from "./profileMappers";

/** Perfil de otra persona (o el propio, visto como lo ven las demás), con el mismo estilo del perfil propio. */
export function PantallaPerfilPublico({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const { styles: baseStyles, isDark } = useAppTheme();
  const { uid } = useSessionUser();
  const { profile: storedProfile, status } = usePublicProfile(userId);
  const { products: userProducts, status: productsStatus } =
    useUserProducts(userId);
  const { back, openProduct } = useAppNavigation();
  const openChat = useOpenChat();
  const { followersCount, isFollowing, pending, toggleFollow } =
    useFollowers(userId);
  const isOwn = userId === uid;

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);

  // Sin ficha de perfil (o si no se pudo leer) se muestra lo que se sabe de la persona
  const profile =
    storedProfile ?? defaultProfile(userProducts[0]?.seller ?? "Usuario");

  if (status === "loading") {
    return (
      <View style={baseStyles.fill}>
        <BackHeader title="Perfil" onBack={back} />
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: fondoPerfil(isDark) }}>
      <ScrollView
        style={baseStyles.screenScroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* La portada llega hasta arriba, detrás de la barra de estado */}
        <PerfilPortada
          cover={profile.cover}
          isDark={isDark}
          topInset={insets.top}
        >
          <PressableSuave
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={back}
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <AppIcon name="back" size={22} color="#101010" />
          </PressableSuave>
        </PerfilPortada>

        <PerfilCabecera
          isDark={isDark}
          avatar={
            <PerfilAvatar
              photo={profile.photo}
              color={profile.color}
              name={profile.name}
              placeholder="iniciales"
            />
          }
          accion={
            isOwn ? null : (
              <BotonSeguir
                isFollowing={isFollowing}
                pending={pending}
                isDark={isDark}
                name={profile.name}
                onPress={() => void toggleFollow()}
              />
            )
          }
        />

        <PerfilInformacion
          profile={profile}
          stats={{
            publicaciones: String(userProducts.length),
            seguidores: String(followersCount),
            reputacion: averageRatingLabel(userProducts),
          }}
          isDark={isDark}
        />

        <View style={{ paddingHorizontal: 15 }}>
          {/* Publicaciones y anuncios, en pestañas */}
          <PublicacionesPerfil
            publicaciones={userProducts}
            anuncios={SIN_ANUNCIOS}
            status={productsStatus}
            isOwn={isOwn}
            isDark={isDark}
            onOpen={openProduct}
          />

          {!isOwn ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: "absolute",
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFFD9",
  },
});
