import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableSuave } from "@/components/PressableSuave";
import { BackHeader } from "@/components/ui/BackHeader";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { ProductFan } from "@/features/marketplace/components/productAbanico";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { PerfilCabecera } from "./components/PerfilCabecera";
import { PerfilInformacion } from "./components/PerfilInformacion";
import { StickersFlotantes } from "./components/StickersFlotantes";
import { TarjetaAccion } from "./components/TarjetaAccion";
import { usePublicProfile } from "./hooks/usePublicProfile";
import { AVATAR_BASE_Y, coloresTarjeta, estilosPerfil } from "./perfilEstilos";
import { IconoMensaje, IconoPublicaciones } from "./Perfiliconos";
import { gradienteCieloPerfil } from "./Perfiltemas";
import { defaultProfile } from "./profileMappers";

/** Todavía no hay seguidores: el número es fijo. */
const SEGUIDORES = "0";

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
  const { width: windowWidth } = useWindowDimensions();

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);

  const cloudHeight = windowWidth * 1.8;
  const cloudTop = 230 - cloudHeight * 0.8;

  const fondoAbajo = isDark ? "#0F172A" : "#f8f8f8";

  // Sin ficha de perfil (o si no se pudo leer) se muestra lo que se sabe de la persona
  const profile =
    storedProfile ?? defaultProfile(userProducts[0]?.seller ?? "Usuario");

  const coloresCielo = gradienteCieloPerfil(profile.color, isDark);

  if (status === "loading") {
    return (
      <View style={baseStyles.fill}>
        <BackHeader title="Perfil" onBack={back} />
        <LoadingState />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* Cielo fijo: cubre desde arriba hasta las nubes, no scrollea */}
      <LinearGradient
        colors={coloresCielo}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + AVATAR_BASE_Y,
          zIndex: 0,
        }}
      />
      {/* Fondo fijo inferior para que todo lo de abajo esté cubierto */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: insets.top + AVATAR_BASE_Y,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: fondoAbajo,
        }}
      />

      <ScrollView
        style={baseStyles.screenScroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Fondo de nubes y capa inferior — se mueven con el scroll */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
          }}
        >
          <Image
            source={require("../../../assets/images/nubes3.png")}
            style={{
              position: "absolute",
              top: cloudTop,
              left: 0,
              width: windowWidth,
              height: cloudHeight,
            }}
            resizeMode="cover"
          />
          <View
            style={{
              position: "absolute",
              top: AVATAR_BASE_Y,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: fondoAbajo,
            }}
          />
        </View>

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
            /* Publicaciones en abanico tipo carrusel infinito, igual que el perfil propio */
            <>
              <View style={styles.publicationsHeader}>
                <Text
                  style={[
                    styles.publicationsTitle,
                    { color: isDark ? "#ffffff" : "#101010" },
                  ]}
                >
                  Publicaciones
                </Text>
                <Text
                  style={[
                    styles.publicationsDescription,
                    { color: isDark ? "#9ca3af" : "#696969" },
                  ]}
                >
                  Todo lo que ha publicado en ReLoop.
                </Text>
              </View>
              <ProductFan items={userProducts} onOpen={openProduct} />
            </>
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
    </View>
  );
}

const styles = StyleSheet.create({
  publicationsHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  publicationsTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  publicationsDescription: {
    fontSize: 12.5,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
