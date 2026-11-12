import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import {
  ChatActivoIcon,
  CorazonActivoIcon,
  type IconProps,
} from "@/components/iconos";
import { Avatar } from "@/components/ui/Avatar";
import { OrbAvatar } from "@/components/ui/OrbAvatar";
import { IconoMensaje } from "@/features/perfil/Perfiliconos";
import { optimizedImageUrl } from "@/lib/imageUrl";
import type { ComponentType } from "react";
import type { AppNotification, NotificationType } from "../types";

/** Icono y colores del círculo de cada tipo que no es "te empezó a seguir". */
const ICONOS: Record<
  Exclude<NotificationType, "seguidor">,
  { Icono: ComponentType<IconProps>; color: string; fondo: string }
> = {
  favorito: { Icono: CorazonActivoIcon, color: "#FF3762", fondo: "#FFE4EA" },
  comentario: { Icono: ChatActivoIcon, color: "#296FFA", fondo: "#E2ECFF" },
  mensaje: { Icono: IconoMensaje, color: "#12915F", fondo: "#DCF5E9" },
};

/**
 * Lo que va a la izquierda de una notificación (en el banner y en la lista): el avatar de
 * la persona si empezó a seguirte (foto, avatar orbe o iniciales) y, para el resto, un
 * icono dentro de un círculo.
 */
export function NotificationLeading({
  notification,
  size,
}: {
  notification: AppNotification;
  size: number;
}) {
  const circulo = { width: size, height: size, borderRadius: size / 2 };

  if (notification.type !== "seguidor") {
    const { Icono, color, fondo } = ICONOS[notification.type];
    return (
      <View style={[styles.centrado, circulo, { backgroundColor: fondo }]}>
        <Icono size={size * 0.5} color={color} />
      </View>
    );
  }

  if (notification.actorPhoto) {
    return (
      <Image
        accessibilityLabel={`Foto de ${notification.actorName}`}
        source={{
          uri:
            optimizedImageUrl(notification.actorPhoto, 200) ??
            notification.actorPhoto,
        }}
        contentFit="cover"
        transition={150}
        style={circulo}
      />
    );
  }

  if (notification.actorOrb !== null) {
    return (
      <OrbAvatar
        orb={notification.actorOrb}
        name={notification.actorName}
        size={size}
      />
    );
  }

  return <Avatar name={notification.actorName} size={size} />;
}

const styles = StyleSheet.create({
  centrado: { alignItems: "center", justifyContent: "center" },
});
