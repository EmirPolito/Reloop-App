import { Image } from "expo-image";
import { memo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { PressableSuave } from "@/components/PressableSuave";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { IconoEditar } from "../Perfiliconos";
import { PELIGRO, TIPO, PALETA, DURACION, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";

export const SeccionFoto = memo(function SeccionFoto({
  photo,
  picking,
  placeholderBg,
  accent,
  modo,
  onPick,
  onRemove,
}: {
  photo: string | null;
  picking: boolean;
  placeholderBg: string;
  accent: string;
  modo: Modo;
  onPick: () => void;
  onRemove: () => void;
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
      {photo ? (
        <Animated.View
          entering={FadeIn.duration(DURACION)}
          exiting={FadeOut.duration(DURACION)}
        >
          <Pressable accessibilityRole="button" onPress={onRemove} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: PELIGRO }}>
              Quitar foto
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
});
