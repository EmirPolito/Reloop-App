import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Animated as AnimatedNativo, StyleSheet, View } from "react-native";

import { optimizedImageUrl } from "@/lib/imageUrl";

/** Alto de la portada abierta (sin contar la barra de estado) */
export const ALTO_PORTADA = 150;
/** Ancho al que se pide la imagen de la portada */
const ANCHO_PORTADA = 900;
/** Alto del relleno de encima de la portada: más de lo que se puede estirar */
const RELLENO_PORTADA = 800;

/** Imagen (o degradado) de la portada y el velo de arriba; llena su contenedor */
export function CapaPortada({
  cover,
  cielo,
  insetTop,
  onError,
}: {
  cover: string | null;
  cielo: [string, string, string];
  insetTop: number;
  onError: () => void;
}) {
  return (
    <>
      {cover ? (
        <Image
          source={{ uri: optimizedImageUrl(cover, ANCHO_PORTADA) ?? cover }}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          transition={200}
          onError={onError}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient colors={cielo} style={StyleSheet.absoluteFill} />
      )}
      {/* Velo arriba para que la hora y los botones se lean sobre cualquier imagen */}
      <LinearGradient
        colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0)"]}
        style={[estilos.veloSuperior, { height: insetTop + 50 }]}
      />
    </>
  );
}

/**
 * La portada dentro del scroll. Se mueve con él de forma nativa y, al estirar hacia abajo
 * (iOS), crece hacia arriba desde su base con `escala` (un valor del driver nativo de
 * Animated, conectado al scroll del lado nativo: llega en el mismo cuadro y no tiembla).
 * Encima, un relleno con la misma portada desenfocada, por si el estiramiento se asoma.
 */
export function PortadaEstirable({
  cover,
  cielo,
  insetTop,
  alto,
  escala,
  onError,
}: {
  /** `null` sin portada (o si falló): entonces va el degradado */
  cover: string | null;
  cielo: [string, string, string];
  insetTop: number;
  alto: number;
  escala: AnimatedNativo.AnimatedInterpolation<number>;
  onError: () => void;
}) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          estilos.relleno,
          { backgroundColor: cover ? "#000000" : cielo[0] },
        ]}
      >
        {cover ? (
          <Image
            source={{ uri: optimizedImageUrl(cover, ANCHO_PORTADA) ?? cover }}
            contentFit="cover"
            contentPosition="bottom"
            cachePolicy="memory-disk"
            // Desenfocada: si se asoma un instante, no se nota la orilla
            blurRadius={24}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>
      <AnimatedNativo.View
        pointerEvents="none"
        style={[
          estilos.portada,
          { height: alto, transform: [{ scale: escala }] },
        ]}
      >
        <CapaPortada
          cover={cover}
          cielo={cielo}
          insetTop={insetTop}
          onError={onError}
        />
      </AnimatedNativo.View>
    </>
  );
}

export const estilos = StyleSheet.create({
  // Bloque alto justo encima del inicio del contenido
  relleno: {
    position: "absolute",
    top: -RELLENO_PORTADA,
    left: 0,
    right: 0,
    height: RELLENO_PORTADA,
    overflow: "hidden",
  },
  portada: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    transformOrigin: "bottom",
  },
  veloSuperior: { position: "absolute", top: 0, left: 0, right: 0 },
});
