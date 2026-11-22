import { View } from "react-native";

import { conSalida } from "@/components/salidaModulo";
import { BackHeader } from "@/components/ui/BackHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import {
  BotonHeaderPerfil,
  PerfilDesplazable,
} from "./components/PerfilDesplazable";
import { useFollowers } from "./hooks/useFollowers";
import { usePublicProfile } from "./hooks/usePublicProfile";
import { IconoCheck, IconoMensajeLinea, IconoSeguirUsuario } from "./Perfiliconos";
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
  const { back, openProduct, openFollows } = useAppNavigation();
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
        <BackHeader title="Perfil" onBack={() => conSalida(back)} />
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
        derecha={
          isOwn ? null : (
            <>
              <BotonHeaderPerfil
                etiqueta={`Enviar mensaje a ${profile.name}`}
                onPress={() => openChat({ id: userId, name: profile.name })}
              >
                <IconoMensajeLinea size={18} color="#FFFFFF" />
              </BotonHeaderPerfil>
              <BotonHeaderPerfil
                etiqueta={
                  isFollowing
                    ? `Dejar de seguir a ${profile.name}`
                    : `Seguir a ${profile.name}`
                }
                onPress={() => void toggleFollow()}
              >
                {isFollowing ? (
                  <IconoCheck size={16} color="#FFFFFF" />
                ) : (
                  <IconoSeguirUsuario size={18} color="#FFFFFF" />
                )}
              </BotonHeaderPerfil>
            </>
          )
        }
        stats={{
          publicaciones: userProducts.length,
          seguidores: followersCount,
          reputacion: averageRatingLabel(userProducts),
        }}
        onSeguidores={() => openFollows(userId)}
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
