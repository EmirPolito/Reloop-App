import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { optimizedImageUrl } from "@/lib/imageUrl";
import type { CategoryId } from "../types";

const ANCHO_GRANDE = 1000;
const ANCHO_MINI = 200;
const LADO_MINI = 56;
/** Miniaturas que se ven; si hay más fotos, la última dice "+N" */
const MINIS_VISIBLES = 3;

/**
 * La foto grande de la publicación con el corazón arriba a la derecha y, abajo y encima de
 * ella, las demás fotos chicas: al tocar una, pasa a la grande.
 */
export function GaleriaPublicacion({
  imagenes,
  categoria,
  favorito,
  onFavorito,
  estilo,
}: {
  imagenes: readonly string[];
  categoria: CategoryId;
  favorito: boolean;
  onFavorito: () => void;
  /** Cambia el marco (p. ej., de orilla a orilla y hasta arriba de la pantalla) */
  estilo?: StyleProp<ViewStyle>;
}) {
  const [elegida, setElegida] = useState(0);
  const actual = imagenes[Math.min(elegida, imagenes.length - 1)];
  const grande = optimizedImageUrl(actual ?? null, ANCHO_GRANDE);

  return (
    <View style={[styles.marco, estilo]}>
      <LinearGradient
        colors={PRODUCT_COLORS[categoria]}
        style={StyleSheet.absoluteFill}
      />
      {grande ? (
        <Image
          source={{ uri: grande }}
          contentFit="cover"
          cachePolicy="memory-disk"
          // Cambio suave al tocar una miniatura
          transition={220}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.sinFoto}>
          <AppIcon name={PRODUCT_ICONS[categoria]} size={58} color="#FFFFFF" />
        </View>
      )}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={
          favorito ? "Quitar de favoritos" : "Agregar a favoritos"
        }
        onPress={onFavorito}
        scaleTo={0.88}
        hitSlop={6}
        style={styles.corazon}
      >
        <Ionicons
          name={favorito ? "heart" : "heart-outline"}
          size={21}
          color={favorito ? "#FF386B" : "#171717"}
        />
      </PressableScale>

      {imagenes.length > 1 ? (
        // Juntas en columna a la derecha, abajo. Se ven hasta 3: si hay más, la última
        // dice "+N" con las que faltan y, al tocarla, va pasando por ellas
        <View style={styles.minis}>
          {imagenes.slice(0, MINIS_VISIBLES).map((uri, i) => {
            const mini = optimizedImageUrl(uri, ANCHO_MINI);
            const conMas =
              i === MINIS_VISIBLES - 1 && imagenes.length > MINIS_VISIBLES;
            const restantes = imagenes.length - MINIS_VISIBLES;
            const activa = conMas ? elegida >= i : i === elegida;
            return (
              <PressableScale
                key={`${uri}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={
                  conMas
                    ? `Ver las otras ${restantes + 1} fotos`
                    : `Ver foto ${i + 1} de ${imagenes.length}`
                }
                accessibilityState={{ selected: activa }}
                onPress={() =>
                  setElegida((actual) =>
                    conMas
                      ? actual < i || actual + 1 >= imagenes.length
                        ? i
                        : actual + 1
                      : i,
                  )
                }
                scaleTo={0.92}
                style={[
                  styles.mini,
                  { borderColor: activa ? "#FFFFFF" : "transparent" },
                ]}
              >
                {mini ? (
                  <Image
                    source={{ uri: mini }}
                    contentFit="cover"
                    style={styles.miniFoto}
                  />
                ) : null}
                {conMas ? (
                  <View style={styles.mas}>
                    <Text style={styles.masTexto}>+{restantes}</Text>
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 28,
    overflow: "hidden",
  },
  sinFoto: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  // Abajo a la izquierda (a la derecha van las miniaturas)
  corazon: {
    position: "absolute",
    left: 14,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  minis: {
    position: "absolute",
    right: 14,
    bottom: 14,
    gap: 6,
  },
  mini: {
    width: LADO_MINI,
    height: LADO_MINI,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  miniFoto: { width: "100%", height: "100%" },
  // "+N" encima de la última miniatura
  mas: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  masTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
