import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { getInitials } from "@/utils/text";
import { estilosPerfil } from "../perfilEstilos";
import { type ColorPerfil, TEMAS } from "../Perfiltemas";

/** Ancho al que se pide la foto de perfil a Cloudinary. */
const ANCHO_FOTO = 400;

/**
 * Avatar dentro del aro de la cabecera: la foto de perfil o, si no hay, un círculo del
 * color del perfil con un icono (perfil propio) o las iniciales (perfil de otra persona).
 */
export function PerfilAvatar({
  photo,
  color,
  name,
  placeholder,
}: {
  photo: string | null;
  color: ColorPerfil;
  name: string;
  placeholder: "icono" | "iniciales";
}) {
  const tema = TEMAS[color] ?? TEMAS.azul;

  if (photo) {
    return (
      <Image
        source={{ uri: optimizedImageUrl(photo, ANCHO_FOTO) ?? photo }}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={200}
        style={styles.image}
      />
    );
  }

  return (
    <View
      style={[estilosPerfil.avatarPlaceholder, { backgroundColor: tema.pillBg }]}
    >
      {placeholder === "icono" ? (
        <AppIcon name="person" size={50} color={tema.accent} />
      ) : (
        <Text style={[styles.initials, { color: tema.accent }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: "100%", borderRadius: 100 },
  initials: { fontSize: 42, fontWeight: "800" },
});
