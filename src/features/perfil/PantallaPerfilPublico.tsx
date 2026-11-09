import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import {
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
import { coloresTarjeta, estilosPerfil } from "./perfilEstilos";
import { IconoMensaje, IconoPublicaciones } from "./Perfiliconos";
import { gradienteAppBackground } from "./Perfiltemas";
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

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);
  const { height: windowHeight } = useWindowDimensions();

  // Sin ficha de perfil (o si no se pudo leer) se muestra lo que se sabe de la persona
  const profile =
    storedProfile ?? defaultProfile(userProducts[0]?.seller ?? "Usuario");

  const backgroundColors = useMemo(
    () => gradienteAppBackground(profile.color, isDark),
    [profile.color, isDark],
  );

  const fondoPantalla = isDark ? "#0F172A" : "#f8f8f8";
  const alturaDegradado = windowHeight * 0.45;

  if (status === "loading") {
    return (
      <View style={baseStyles.fill}>
        <BackHeader title="Perfil" onBack={back} />
        <LoadingState />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: fondoPantalla,
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        style={baseStyles.screenScroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Extensión superior para rebote al estirar hacia abajo */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -500,
            left: 0,
            right: 0,
            height: 500,
            backgroundColor: backgroundColors[0],
          }}
        />

        {/* Degradado en la cabecera que scrollea con el contenido (no sigue la pantalla) */}
        <LinearGradient
          colors={backgroundColors}
          locations={[0, 0.25, 0.6, 1.0]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: alturaDegradado,
          }}
        />

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
