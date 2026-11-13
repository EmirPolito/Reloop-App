import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { OrbAvatar } from "@/components/ui/OrbAvatar";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { getInitials } from "@/utils/text";
import { LADO_AVATAR, estilosPerfil } from "../perfilEstilos";
import { type ColorPerfil, TEMAS } from "../Perfiltemas";
import { BrilloAvatar } from "./BrilloAvatar";

/** Ancho al que se pide la foto de perfil a Cloudinary. */
const ANCHO_FOTO = 400;

/**
 * Avatar dentro del marco de la cabecera: la foto de perfil; si no hay, el avatar orbe
 * elegido; y si tampoco, un icono (perfil propio) o las iniciales (perfil de otra persona).
 */
export function PerfilAvatar({
  photo,
  orb,
  color,
  name,
  placeholder,
}: {
  photo: string | null;
  orb: number | null;
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

  if (orb !== null) {
    return <OrbAvatar orb={orb} name={name} size={LADO_AVATAR} />;
  }

  return (
    <View
      style={[
        estilosPerfil.avatarPlaceholder,
        { backgroundColor: tema.pillBg },
      ]}
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
