import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { BackHeader } from "@/components/ui/BackHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { BotonSeguir } from "./components/BotonSeguir";
import { PerfilDesplazable } from "./components/PerfilDesplazable";
import { useFollowers } from "./hooks/useFollowers";
import { usePublicProfile } from "./hooks/usePublicProfile";
import { IconoMensaje } from "./Perfiliconos";
import { defaultProfile } from "./profileMappers";

/**
 * Perfil de otra persona (o el propio, visto como lo ven las demás), con la misma
 * estructura animada del perfil propio y sin botón de volver (la barra de abajo y el gesto
 * del sistema ya llevan atrás). La insignia Premium va junto al nombre.
 */
export function PantallaPerfilPublico({ userId }: { userId: string }) {
  const { styles: baseStyles, isDark } = useAppTheme();
  const { uid } = useSessionUser();
  const { profile: storedProfile, status } = usePublicProfile(userId);
  const { products: userProducts, status: productsStatus } =
    useUserProducts(userId);
  const { back, openProduct } = useAppNavigation();
  const openChat = useOpenChat();
  const { followersCount, isFollowing, pending, toggleFollow } =
    useFollowers(userId);
  const premium = useIsPremium(userId);
  const isOwn = userId === uid;

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
    <View style={{ flex: 1 }}>
      <PerfilDesplazable
        profile={profile}
        isDark={isDark}
        placeholder="iniciales"
        premium={premium}
        acciones={
          isOwn ? null : (
            <>
              <PressableSuave
                accessibilityRole="button"
                accessibilityLabel={`Enviar mensaje a ${profile.name}`}
                onPress={() => openChat({ id: userId, name: profile.name })}
                style={[
                  styles.mensaje,
                  { borderColor: isDark ? "#334155" : "#D4D4D8" },
                ]}
              >
                <IconoMensaje
                  size={20}
                  color={isDark ? "#F1F5F9" : "#101010"}
                />
              </PressableSuave>
              <BotonSeguir
                isFollowing={isFollowing}
                pending={pending}
                isDark={isDark}
                name={profile.name}
                onPress={() => void toggleFollow()}
              />
            </>
          )
        }
        stats={{
          publicaciones: userProducts.length,
          seguidores: followersCount,
          reputacion: averageRatingLabel(userProducts),
        }}
        publicaciones={{
          items: userProducts,
          status: productsStatus,
          isOwn,
          onOpen: openProduct,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mensaje: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
