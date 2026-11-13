import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { OrbAvatar } from "@/components/ui/OrbAvatar";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { getInitials } from "@/utils/text";

/**
 * Avatar circular de una persona, en el orden en que lo elige en Editar perfil: su foto;
 * si no tiene, el avatar orbe; y si tampoco, sus iniciales. Si la foto no carga, cae a lo
 * siguiente sin dejar el círculo vacío.
 */
export function UserAvatar({
  photo,
  orb,
  name,
  size,
  style,
}: {
  photo: string | null;
  orb: number | null;
  name: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { styles } = useAppTheme();
  // Se recuerda qué foto falló: si cambia la foto, se vuelve a intentar
  const [fotoFallida, setFotoFallida] = useState<string | null>(null);
  const circulo = { width: size, height: size, borderRadius: size / 2 };

  if (photo && photo !== fotoFallida) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={`Foto de ${name}`}
        style={[styles.avatar, circulo, style]}
      >
        <Image
          source={{ uri: optimizedImageUrl(photo, size * 3) ?? photo }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setFotoFallida(photo)}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  if (orb !== null) {
    return <OrbAvatar orb={orb} name={name} size={size} style={style} />;
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Avatar de ${name}`}
      style={[styles.avatar, circulo, style]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
