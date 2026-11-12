import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { getInitials } from "@/utils/text";
import { estilosPerfil } from "../perfilEstilos";
import { type ColorPerfil, TEMAS } from "../Perfiltemas";
import { BrilloAvatar } from "./BrilloAvatar";

/** Ancho al que se pide la foto de perfil a Cloudinary. */
const ANCHO_FOTO = 400;

/**
 * Avatar dentro del marco de la cabecera: la foto de perfil o, si no hay, un cuadro del
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
      <View style={styles.marco}>
        <Image
          source={{ uri: optimizedImageUrl(photo, ANCHO_FOTO) ?? photo }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={200}
          style={StyleSheet.absoluteFill}
        />
        <BrilloAvatar id="perfil-avatar" />
      </View>
    );
  }

  return (
    <View
      style={[estilosPerfil.avatarPlaceholder, { backgroundColor: tema.pillBg }]}
    >
      {placeholder === "icono" ? (
        <AppIcon name="person" size={44} color={tema.accent} />
      ) : (
        <Text style={[styles.initials, { color: tema.accent }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    overflow: "hidden",
  },
  initials: { fontSize: 34, fontWeight: "800" },
});
