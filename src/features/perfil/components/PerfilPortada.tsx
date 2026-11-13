import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { optimizedImageUrl } from "@/lib/imageUrl";
import { fondoPerfil } from "../perfilEstilos";

/** Ancho al que se pide la portada a Cloudinary */
const ANCHO_PORTADA = 900;

/** Curva de opacidad del desvanecido inferior: seis paradas, sin cortes ni bandas */
const ALFAS_DESVANECIDO = [0, 0.08, 0.28, 0.62, 0.9, 1] as const;
const PARADAS_DESVANECIDO = [0, 0.25, 0.5, 0.72, 0.88, 1] as const;
/** Parte inferior de la imagen que cubre el desvanecido */
const ALTO_DESVANECIDO = "55%";

/** `#rrggbb[aa]` → `rgba(r, g, b, alfa)` */
function conAlfa(hex: string, alfa: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

/**
 * Fondo (portada) del perfil: la imagen ocupa todo su contenedor y la mitad inferior se
 * disuelve en el color de la pantalla, así el avatar y el texto que se montan encima
 * quedan sobre una transición limpia. Arriba, un velo muy suave mantiene legibles la
 * hora y los botones flotantes sobre cualquier foto.
 */
export function PerfilPortada({
  cover,
  isDark,
}: {
  cover: string;
  isDark: boolean;
}) {
  const fondo = fondoPerfil(isDark);
  const desvanecido = ALFAS_DESVANECIDO.map((alfa) => conAlfa(fondo, alfa)) as [
    string,
    string,
    ...string[],
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: optimizedImageUrl(cover, ANCHO_PORTADA) ?? cover }}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        transition={200}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[conAlfa(fondo, 0.5), conAlfa(fondo, 0)]}
        style={styles.veloSuperior}
      />
      <LinearGradient
        colors={desvanecido}
        locations={[...PARADAS_DESVANECIDO]}
        style={styles.desvanecido}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  veloSuperior: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  desvanecido: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: ALTO_DESVANECIDO,
  },
});
