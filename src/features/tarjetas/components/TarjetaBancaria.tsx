import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Text as NativeText, Platform, StyleSheet, View } from "react-native";
import {
  Circle,
  Defs,
  LinearGradient as Degradado,
  Path,
  Rect,
  Stop,
  Svg,
} from "react-native-svg";

import { Text } from "@/features/shared/Text";
import { claveEnTarjeta, type ColorVista } from "../formatoTarjeta";

/** Proporción de una tarjeta bancaria real (85.6 × 54 mm) */
export const PROPORCION_TARJETA = 1.586;
/** Ancho de diseño: las medidas internas se escalan desde aquí */
const ANCHO_BASE = 256;

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

/** Degradado de cada color, de arriba a la izquierda hacia abajo a la derecha */
export const DEGRADADOS: Record<ColorVista, readonly [string, string]> = {
  rojo: ["#FF7A6E", "#E5262B"],
  amarillo: ["#FFE27A", "#F5B800"],
  azul: ["#6B98FF", "#2471ffff"],
  negro: ["#2E2E31", "#131315"],
  morado: ["#B197FC", "#632eebff"],
  gris: ["#BCBFC6", "#8E929B"],
};

/** Colores del texto y los arcos según la tarjeta (en la amarilla, oscuros para leerse) */
function tintaDe(color: ColorVista) {
  if (color === "negro")
    return {
      suave: "#B9B9BD",
      fuerte: "#E4E4E7",
      arco: "#FFFFFF",
      opArco: 0.13,
    };
  if (color === "amarillo")
    return {
      suave: "rgba(58,44,0,0.72)",
      fuerte: "#2E2300",
      arco: "#7A5B00",
      opArco: 0.2,
    };
  return {
    suave: "rgba(255,255,255,0.85)",
    fuerte: "#FFFFFF",
    arco: "#FFFFFF",
    opArco: 0.2,
  };
}

/** Los arcos finos que salen de la esquina de arriba a la derecha */
const ARCOS = Array.from({ length: 16 }, (_, i) => 0.28 + i * 0.075);

function Chip({ ancho, dorado }: { ancho: number; dorado: boolean }) {
  const alto = ancho * 0.76;
  const [claro, oscuro] = dorado
    ? ["#F8DC86", "#D6A23A"]
    : ["#EDEDED", "#A6A6A6"];
  const linea = dorado ? "#B9862A" : "#8C8C8C";
  return (
    <Svg width={ancho} height={alto} viewBox="0 0 40 30">
      <Defs>
        <Degradado
          id={dorado ? "chip-dorado" : "chip-plata"}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <Stop offset="0" stopColor={claro} />
          <Stop offset="1" stopColor={oscuro} />
        </Degradado>
      </Defs>
      <Rect
        x={0.5}
        y={0.5}
        width={39}
        height={29}
        rx={6}
        fill={dorado ? "url(#chip-dorado)" : "url(#chip-plata)"}
      />
      <Path
        d="M0.5 10H12M0.5 20H12M28 10H39.5M28 20H39.5M12 4V26M28 4V26M12 15H28"
        stroke={linea}
        strokeWidth={1.1}
        opacity={0.7}
      />
    </Svg>
  );
}

/**
 * La cara de una tarjeta: el color con sus arcos y el chip; arriba la institución, en medio y
 * grande la clave, y abajo el beneficiario. Se usa en la billetera, en la lista para elegir, en
 * el mensaje del chat y, sin textos, en el selector de color.
 */
export const TarjetaBancaria = memo(function TarjetaBancaria({
  institucion = "",
  clave = "",
  beneficiario = "",
  color,
  ancho,
  claveVisible = false,
  soloDiseno = false,
}: {
  institucion?: string;
  /** Solo dígitos (puede venir incompleta mientras se escribe) */
  clave?: string;
  beneficiario?: string;
  color: ColorVista;
  ancho: number;
  /** La clave completa; si no, solo los últimos cuatro */
  claveVisible?: boolean;
  /** Solo el color, los arcos y el chip (la vista previa del selector de color) */
  soloDiseno?: boolean;
}) {
  const alto = ancho / PROPORCION_TARJETA;
  const f = ancho / ANCHO_BASE;
  const oscura = color === "negro";
  const tinta = tintaDe(color);
  const suave = tinta.suave;

  return (
    // La sombra va por fuera: con `overflow: hidden` iOS la recorta
    <View style={[styles.sombra, { borderRadius: 14 * f }]}>
      <View
        style={{
          width: ancho,
          height: alto,
          borderRadius: 14 * f,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={DEGRADADOS[color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill}>
          {ARCOS.map((r) => (
            <Circle
              key={r}
              cx={ancho * 1.02}
              cy={-alto * 0.32}
              r={ancho * r}
              stroke={tinta.arco}
              strokeOpacity={tinta.opArco}
              strokeWidth={0.8}
              fill="none"
            />
          ))}
        </Svg>

        <View style={{ position: "absolute", top: 20 * f, right: 20 * f }}>
          <Chip ancho={38 * f} dorado={!oscura} />
        </View>

        {soloDiseno ? null : (
          <>
            <Text
              numberOfLines={1}
              style={{
                position: "absolute",
                top: 22 * f,
                left: 20 * f,
                right: 70 * f,
                color: suave,
                fontSize: 11.5 * f,
                fontWeight: "600",
                letterSpacing: 1.6 * f,
              }}
            >
              {institucion || "INSTITUCIÓN"}
            </Text>
            <NativeText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                position: "absolute",
                // Centrada en el alto de la tarjeta
                top: alto * 0.5 - 10 * f,
                left: 20 * f,
                right: 18 * f,
                color: tinta.fuerte,
                fontFamily: MONO,
                fontSize: 15.5 * f,
                letterSpacing: 0.8 * f,
              }}
            >
              {claveEnTarjeta(clave, claveVisible)}
            </NativeText>
            <Text
              numberOfLines={1}
              style={{
                position: "absolute",
                bottom: 14 * f,
                left: 20 * f,
                right: 20 * f,
                color: suave,
                fontSize: 11 * f,
                fontWeight: "600",
                letterSpacing: 1.4 * f,
              }}
            >
              {beneficiario || "BENEFICIARIO"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sombra: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
