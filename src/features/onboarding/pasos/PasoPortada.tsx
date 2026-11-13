import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { coloresEditar, INTER } from "@/features/perfil/editar/editarTema";
import { Opcion } from "@/features/perfil/editar/SelectorAvatar";
import {
  gradienteCieloPerfil,
  type ColorPerfil,
} from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { BotonPaso } from "../components/BotonPaso";

/**
 * Paso 1: la portada (fondo del perfil, distinta del avatar). Se toma con la cámara o se
 * elige de la galería con el mismo recorte 4:3 de Editar perfil, se previsualiza y solo se
 * guarda al continuar. Es opcional.
 */
export function PasoPortada({
  cover,
  color,
  isDark,
  onGuardar,
  onSiguiente,
}: {
  cover: string | null;
  color: ColorPerfil;
  isDark: boolean;
  /** Sube y guarda la portada; si falla lanza (y ya avisó) */
  onGuardar: (cover: string) => Promise<void>;
  onSiguiente: () => void;
}) {
  const c = coloresEditar(isDark);
  const { pickCoverImage, takeCoverPhoto, isPicking } = useImagePicker();
  const [elegida, setElegida] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const mostrada = elegida ?? cover;

  const elegir = async (desde: "camara" | "galeria") => {
    if (isPicking) return;
    const uri =
      desde === "camara" ? await takeCoverPhoto() : await pickCoverImage();
    if (uri) setElegida(uri);
  };

  const continuar = async () => {
    if (!elegida) {
      onSiguiente();
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(elegida);
      onSiguiente();
    } catch {
      // Ya se avisó; se queda en el paso para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.paso}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          mostrada ? "Vista previa de tu portada" : "Aún no tienes portada"
        }
        style={styles.vista}
      >
        {mostrada ? (
          <Image
            source={{ uri: optimizedImageUrl(mostrada, 900) ?? mostrada }}
            contentFit="cover"
            transition={200}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={gradienteCieloPerfil(color, isDark)}
            style={[StyleSheet.absoluteFill, styles.vacia]}
          >
            <Ionicons name="image-outline" size={28} color="#FFFFFFdd" />
            <Text style={[INTER.medium, styles.vaciaTexto]}>
              El fondo de tu perfil
            </Text>
          </LinearGradient>
        )}
      </View>

      <Text style={[INTER.regular, styles.ayuda, { color: c.suave }]}>
        Aparece detrás de tu avatar en tu perfil. Puedes cambiarla cuando
        quieras.
      </Text>

      <View style={styles.opciones}>
        <Opcion
          icono="camera-outline"
          texto="Tomar"
          isDark={isDark}
          disabled={isPicking || guardando}
          onPress={() => void elegir("camara")}
        />
        <Opcion
          icono="images-outline"
          texto="Elegir"
          isDark={isDark}
          disabled={isPicking || guardando}
          onPress={() => void elegir("galeria")}
        />
      </View>

      <BotonPaso
        texto={
          elegida
            ? "Usar esta portada"
            : mostrada
              ? "Continuar"
              : "Omitir por ahora"
        }
        isDark={isDark}
        cargando={guardando}
        onPress={() => void continuar()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paso: { paddingHorizontal: 17, gap: 16, paddingTop: 4 },
  vista: {
    height: 150,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E7E7E9",
  },
  vacia: { alignItems: "center", justifyContent: "center", gap: 6 },
  vaciaTexto: { fontSize: 13.5, color: "#FFFFFF" },
  ayuda: { fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: -4 },
  opciones: { flexDirection: "row", gap: 15 },
});
