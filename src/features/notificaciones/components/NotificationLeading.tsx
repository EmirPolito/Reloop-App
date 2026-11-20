import { StyleSheet, View } from "react-native";

import {
  ChatActivoIcon,
  CorazonActivoIcon,
  type IconProps,
} from "@/components/iconos";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { IconoMensaje } from "@/features/perfil/Perfiliconos";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import type { ComponentType } from "react";
import type { AppNotification, NotificationType } from "../types";

/** Icono y color del círculo de cada tipo que no es "te empezó a seguir" (fondo del color, icono blanco). */
const ICONOS: Record<
  Exclude<NotificationType, "seguidor">,
  { Icono: ComponentType<IconProps>; color: string }
> = {
  favorito: { Icono: CorazonActivoIcon, color: "#FF3D63" },
  comentario: { Icono: ChatActivoIcon, color: "#2F6BFF" },
  mensaje: { Icono: IconoMensaje, color: "#10B981" },
};

/** El icono ocupa algo más de la mitad del círculo */
const PROPORCION_ICONO = 0.62;

/**
 * Lo que va a la izquierda de una notificación (en el banner y en la lista): el avatar de
 * la persona si empezó a seguirte (su foto o avatar de ahora, con sus iniciales mientras
 * llega) y, para el resto, un icono dentro de un círculo. La insignia Premium de quien la
 * provocó solo se ve en el avatar, nunca sobre el círculo con icono.
 */
export function NotificationLeading({
  notification,
  size,
}: {
  notification: AppNotification;
  size: number;
}) {
  const perfil = usePerfilDe(notification.actorId) ?? null;
  const premium = useIsPremium(notification.actorId);

  if (notification.type !== "seguidor") {
    const { Icono, color } = ICONOS[notification.type];
    return (
      <View
        style={[
          styles.centrado,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            // Fondo fuerte (el color del tipo) con el icono blanco
            backgroundColor: color,
          },
        ]}
      >
        <Icono size={size * PROPORCION_ICONO} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <UserAvatar
      photo={perfil ? perfil.photo : notification.actorPhoto}
      orb={perfil ? perfil.orb : notification.actorOrb}
      name={perfil?.name ?? notification.actorName}
      size={size}
      premium={premium}
    />
  );
}

const styles = StyleSheet.create({
  centrado: { alignItems: "center", justifyContent: "center" },
});
