import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { optimizedImageUrl } from "@/lib/imageUrl";
import { ALTO_PORTADA } from "../perfilEstilos";

/** Ancho al que se pide la portada a Cloudinary */
const ANCHO_PORTADA = 900;

/** Redondeo de las esquinas inferiores de la portada */
const RADIO_PORTADA = 21;

/**
 * Portada del perfil: la imagen de fondo elegida, como una tarjeta que llega hasta arriba
 * (detrás de la hora) y termina con las esquinas inferiores redondeadas.
 */
export function PerfilPortada({
  cover,
  isDark,
  topInset = 0,
  children,
}: {
  cover: string | null;
  isDark: boolean;
  /** Alto extra para dibujar la portada también detrás de la barra de estado */
  topInset?: number;
  /** Navegación que va encima de la portada */
  children?: ReactNode;
}) {
  // Sin imagen: tarjeta gris lisa
  const vacio = isDark ? "#1E293B" : "#DADCE2";

  return (
    <View style={{ height: ALTO_PORTADA + topInset }}>
      {/* Extensión superior para el rebote al estirar hacia abajo */}
      <View
        pointerEvents="none"
        style={[styles.rebote, { backgroundColor: vacio }]}
      />

      <View style={[styles.tarjeta, { backgroundColor: vacio }]}>
        {cover ? (
          <Image
            source={{ uri: optimizedImageUrl(cover, ANCHO_PORTADA) ?? cover }}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            transition={200}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {/* Sombra suave arriba para que la hora se lea sobre cualquier foto */}
        {cover && topInset > 0 ? (
          <LinearGradient
            pointerEvents="none"
            colors={["#00000040", "#00000000"]}
            style={[styles.sombraSuperior, { height: topInset + 50 }]}
          />
        ) : null}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rebote: {
    position: "absolute",
    top: -500,
    left: 0,
    right: 0,
    height: 500,
  },
  tarjeta: {
    ...StyleSheet.absoluteFill,
    borderBottomLeftRadius: RADIO_PORTADA,
    borderBottomRightRadius: RADIO_PORTADA,
    overflow: "hidden",
  },
  sombraSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
});
