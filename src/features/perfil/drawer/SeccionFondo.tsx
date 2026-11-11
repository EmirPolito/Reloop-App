import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { Image } from "expo-image";
import { memo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { IconoEditar } from "../Perfiliconos";
import { RADIO, PALETA, PELIGRO, TIPO, type Modo } from "./drawerTheme";

/** Imagen de fondo (portada) del perfil: vista previa, cambiar y quitar */
export const SeccionFondo = memo(function SeccionFondo({
  cover,
  picking,
  modo,
  onPick,
  onRemove,
}: {
  cover: string | null;
  picking: boolean;
  modo: Modo;
  onPick: () => void;
  onRemove: () => void;
}) {
  const p = PALETA[modo];
  return (
    <View style={styles.wrap}>
      <PressableSuave
        accessibilityRole="button"
        accessibilityLabel={
          cover ? "Cambiar imagen de fondo" : "Agregar imagen de fondo"
        }
        onPress={onPick}
        disabled={picking}
        style={[styles.banner, { backgroundColor: p.tarjeta }]}
      >
        {cover ? (
          <Image
            source={{ uri: cover }}
            contentFit="cover"
            transition={200}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            styles.overlay,
            { backgroundColor: cover ? p.veloConFoto : "transparent" },
          ]}
        >
          {picking ? (
            <ActivityIndicator color={cover ? "#FFFFFF" : p.suave} />
          ) : (
            <>
              <IconoEditar size={22} color={cover ? "#FFFFFF" : p.suave} />
              <Text
                style={{
                  fontSize: TIPO.ayuda,
                  color: cover ? "#FFFFFF" : p.suave,
                }}
              >
                {cover ? "Cambiar imagen de fondo" : "Agregar imagen de fondo"}
              </Text>
            </>
          )}
        </View>
      </PressableSuave>

      {cover ? (
        <PressableSuave
          accessibilityRole="button"
          accessibilityLabel="Quitar imagen de fondo"
          onPress={onRemove}
          style={styles.quitar}
        >
          <Text style={{ fontSize: TIPO.ayuda, color: PELIGRO }}>
            Quitar imagen de fondo
          </Text>
        </PressableSuave>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  banner: {
    height: 120,
    borderRadius: RADIO,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  quitar: { alignSelf: "center", paddingVertical: 4 },
});
