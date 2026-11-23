import MaskedViewOriginal, {
  type MaskedViewProps,
} from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, type ComponentType } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Neblina } from "./Neblina";
import { CON_DESENFOQUE } from "./PildoraCristal";

// Sus tipos son de una versión anterior de React (componente de clase): mismo componente, tipado
const MaskedView =
  MaskedViewOriginal as unknown as ComponentType<MaskedViewProps>;

/** Intensidad del desenfoque donde es más fuerte (la hora y la cabecera) */
const INTENSIDAD_DESENFOQUE = 22;
/** El velo: muy blanco arriba y apenas baja hasta donde empieza a desvanecerse */
const OPACIDAD_ARRIBA = 0.98;
const OPACIDAD_INICIO = 0.92;
const CAPAS_VELO = 18;

/**
 * Velo del color de fondo en muchas capas: de `OPACIDAD_ARRIBA` a `OPACIDAD_INICIO` hasta
 * `inicio` (fracción del alto) y de ahí se desvanece a nada, con una curva que arranca y
 * termina despacio (sin escalones ni final recto)
 */
function veloPorCapas(rgb: string, inicio: number, factor: number) {
  const colores: string[] = [];
  const posiciones: number[] = [];
  const curva = (t: number) => t * t * (3 - 2 * t);
  for (let i = 0; i < CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const opacidad =
      (OPACIDAD_ARRIBA - (OPACIDAD_ARRIBA - OPACIDAD_INICIO) * curva(t)) *
      factor;
    colores.push(`rgba(${rgb},${opacidad.toFixed(3)})`);
    posiciones.push(inicio * t);
  }
  for (let i = 0; i <= CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const opacidad = OPACIDAD_INICIO * (1 - curva(t)) * factor;
    colores.push(`rgba(${rgb},${opacidad.toFixed(3)})`);
    posiciones.push(inicio + (1 - inicio) * t);
  }
  return {
    colores: colores as unknown as readonly [string, string, ...string[]],
    posiciones: posiciones as unknown as readonly [number, number, ...number[]],
  };
}

/**
 * Máscara CSS del desenfoque en web: completa hasta `inicio` y de ahí se desvanece con la
 * misma curva del velo (por capas), para que no quede una orilla al final
 */
function mascaraSuave(inicio: number) {
  const curva = (t: number) => t * t * (3 - 2 * t);
  const paradas = ["#000 0%", `#000 ${inicio * 100}%`];
  for (let i = 1; i <= CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const alfa = (1 - curva(t)).toFixed(3);
    paradas.push(`rgba(0,0,0,${alfa}) ${(inicio + (1 - inicio) * t) * 100}%`);
  }
  return `linear-gradient(to bottom, ${paradas.join(", ")})`;
}

/**
 * Neblina de las cabeceras flotantes (inicio y búsqueda): lo que pasa por detrás se ve
 * borroso y con su color, con un velo blanco encima. Un solo desenfoque con una máscara en
 * degradado (sin capas ni orillas) completo hasta `inicioDesenfoque` y que se desvanece hasta
 * `alto`; el velo, casi sólido hasta `inicioVelo` y de ahí desvaneciéndose hasta `alto`.
 * En Android (sin desenfoque en la app) es la neblina de color. Medidas en px desde arriba.
 */
export function NeblinaDesenfocada({
  alto,
  inicioVelo,
  inicioDesenfoque,
  opacidadVelo = 1,
}: {
  alto: number;
  inicioVelo: number;
  inicioDesenfoque: number;
  /** Qué tan blanco es el velo (1 = casi sólido arriba); menos deja ver más lo de atrás */
  opacidadVelo?: number;
}) {
  const { isDark } = useAppTheme();
  const proporcion = (px: number) => Math.min(Math.max(px / alto, 0.01), 0.99);
  const velo = useMemo(
    () =>
      veloPorCapas(
        isDark ? "22,22,22" : "252,252,252",
        Math.min(Math.max(inicioVelo / alto, 0.01), 0.99),
        opacidadVelo,
      ),
    [isDark, inicioVelo, alto, opacidadVelo],
  );

  if (!CON_DESENFOQUE) {
    return (
      <Neblina
        style={[styles.capa, { height: alto }]}
        corte={proporcion(inicioDesenfoque)}
      />
    );
  }

  return (
    <View pointerEvents="none" style={[styles.capa, { height: alto }]}>
      {Platform.OS === "web" ? (
        // En web `MaskedView` no recorta (dibuja la máscara negra encima): máscara CSS
        <BlurView
          intensity={INTENSIDAD_DESENFOQUE}
          tint={isDark ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            {
              maskImage: mascaraSuave(proporcion(inicioDesenfoque)),
            } as object,
          ]}
        />
      ) : (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={["#000000", "#000000", "rgba(0,0,0,0)"]}
              locations={[0, proporcion(inicioDesenfoque), 1]}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={INTENSIDAD_DESENFOQUE}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      )}
      <LinearGradient
        colors={velo.colores}
        locations={velo.posiciones}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: "absolute", top: 0, left: 0, right: 0 },
});
