import { PressableSuave } from "@/components/PressableSuave";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { Image } from "expo-image";
import { memo } from "react";
import { ActivityIndicator, View } from "react-native";
import { IconoEditar } from "../Perfiliconos";
import { styles } from "./drawerStyles";
import { PALETA, TIPO, type Modo } from "./drawerTheme";

export const SeccionFoto = memo(function SeccionFoto({
  photo,
  picking,
  placeholderBg,
  accent,
  modo,
  onPick,
}: {
  photo: string | null;
  picking: boolean;
  placeholderBg: string;
  accent: string;
  modo: Modo;
  onPick: () => void;
}) {
  const p = PALETA[modo];
  return (
    <View style={styles.avatarWrap}>
      <PressableSuave
        accessibilityRole="button"
        accessibilityLabel={
          photo ? "Cambiar foto de perfil" : "Agregar foto de perfil"
        }
        onPress={onPick}
        disabled={picking}
        style={styles.avatar}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            contentFit="cover"
            transition={200}
            style={styles.fill}
          />
        ) : (
          <View
            style={[
              styles.fill,
              styles.centrado,
              { backgroundColor: placeholderBg },
            ]}
          >
            <AppIcon name="person" size={40} color={accent} />
          </View>
        )}
        <View
          style={[
            styles.avatarOverlay,
            { backgroundColor: photo ? p.veloConFoto : p.velo },
          ]}
        >
          {picking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <IconoEditar size={22} color="#FFFFFF" />
          )}
        </View>
      </PressableSuave>

      <Text style={{ fontSize: TIPO.ayuda, color: p.suave }}>
        Toca la foto para cambiarla
      </Text>
    </View>
  );
});
