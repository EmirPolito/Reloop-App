import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** El avatar aparece suave cuando su perfil llega después de mostrarse */
const APARICION = FadeIn.duration(220);

/**
 * Avatar actual de quien vende: lee su perfil en vivo (la publicación no guarda su foto, y
 * el nombre que trae es solo una copia de cuando publicó). Mientras llega el perfil se ve
 * un círculo vacío (no las iniciales, que luego brincaban a la foto) y al llegar aparece
 * con un fundido; si ya estaba leído, sale de inmediato.
 */
export function AvatarVendedor({
  ownerId,
  fallbackName,
  size,
  ajusteInsignia,
}: {
  ownerId: string;
  /** Nombre de la publicación, mientras llega el del perfil */
  fallbackName: string;
  size: number;
  ajusteInsignia?: { escala: number; right: number; bottom: number };
}) {
  const { styles } = useAppTheme();
  const perfil = usePerfilDe(ownerId);
  const premium = useIsPremium(ownerId);
  // Solo se anima si al mostrarse aún no estaba el perfil
  const [llegaDespues] = useState(perfil === undefined);

  if (perfil === undefined) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    );
  }

  const avatar = (
    <UserAvatar
      photo={perfil?.photo ?? null}
      orb={perfil?.orb ?? null}
      name={perfil?.name ?? fallbackName}
      size={size}
      premium={premium}
      ajusteInsignia={ajusteInsignia}
    />
  );
  return llegaDespues ? (
    <Animated.View entering={APARICION}>{avatar}</Animated.View>
  ) : (
    avatar
  );
}
