import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { APP_BACKGROUND } from "@/features/shared/constants";

/** Fondo sólido de la pantalla en claro (en oscuro, el de siempre de la app) */
const BASE_CLARO = "#FDFDFD";
/** Parte de la altura de la pantalla que ocupa el resplandor de arriba */
const PROPORCION_ALTO = 0.3;

/**
 * Tres manchas pequeñas, juntas y muy difuminadas: dos arriba, una al lado de la otra (menta
 * y lavanda), y una abajo en medio de ellas (durazno). `x` es la fracción del ancho; `dy`,
 * los píxeles bajo la barra de estado; `radio`, la fracción del ancho.
 */
const MANCHAS = [
  { id: "menta", x: 0.38, dy: 26, radio: 0.4, claro: "#C5EAD8", opacidad: 0.7 },
  { id: "lavanda", x: 0.64, dy: 26, radio: 0.4, claro: "#CBD9F7", opacidad: 0.6 },
  { id: "durazno", x: 0.51, dy: 66, radio: 0.42, claro: "#F8C4A8", opacidad: 0.75 },
] as const;

/**
 * Cómo se apaga cada mancha del centro al borde (posición, fracción del color): una curva
 * como la de una campana, sin cortes, para que no se distinga ninguna forma.
 */
const CAIDA: readonly (readonly [string, number])[] = [
  ["0", 1],
  ["0.2", 0.82],
  ["0.4", 0.52],
  ["0.6", 0.25],
  ["0.8", 0.08],
  ["1", 0],
];

/** Las mismas manchas en oscuro: tonos más profundos y más tenues */
const OSCURO: Record<(typeof MANCHAS)[number]["id"], string> = {
  durazno: "#8A5A4A",
  menta: "#3F6A5A",
  lavanda: "#4A5C8F",
};

/**
 * Fondo del inicio: color sólido casi blanco con un resplandor tipo aurora arriba, hecho con
 * tres manchas de color pastel (durazno al centro, menta a la izquierda y lavanda a la
 * derecha) que se difuminan por completo hacia el fondo antes de llegar al banner. Usa
 * degradados radiales de SVG y un degradado lineal, sin imágenes. Cubre también la barra de
 * estado, que queda sin color propio. Va detrás de todo y no recibe toques.
 */
export function FondoHome({
  intensidad = 1,
  dentroDeEscena = true,
  colorBase,
}: {
  /** Qué tan marcados se ven los colores de arriba (1 = como en el inicio) */
  intensidad?: number;
  /** En una pestaña la escena deja libre el espacio de la hora y el fondo sube a cubrirlo; en una pantalla que ya empieza arriba del todo, no */
  dentroDeEscena?: boolean;
  /** Color liso de fondo en lugar del blanco de siempre (en claro) */
  colorBase?: string;
}) {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const base = isDark ? APP_BACKGROUND.dark : (colorBase ?? BASE_CLARO);
  // El resplandor llega hasta arriba del todo: se suma lo que la escena deja para la hora
  const alto = Math.round(height * PROPORCION_ALTO) + insets.top;

  return (
    <View
      pointerEvents="none"
      style={[
        estilos.fondo,
        { top: dentroDeEscena ? -insets.top : 0, backgroundColor: base },
      ]}
    >
      {/* Base del resplandor: los tres colores mezclados de lado a lado, como un solo degradado */}
      <LinearGradient
        pointerEvents="none"
        colors={
          isDark
            ? [`${OSCURO.menta}55`, `${OSCURO.durazno}55`, `${OSCURO.lavanda}55`]
            : ["#C5EAD8B3", "#F8C4A8B3", "#CBD9F7B3"]
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[estilos.mezcla, { height: alto, opacity: intensidad }]}
      />
      <Svg width={width} height={alto} style={{ opacity: intensidad }}>
        <Defs>
          {MANCHAS.map((mancha) => (
            <RadialGradient
              key={mancha.id}
              id={mancha.id}
              cx={width * mancha.x}
              cy={insets.top + mancha.dy}
              r={width * mancha.radio}
              gradientUnits="userSpaceOnUse"
            >
              {CAIDA.map(([offset, factor]) => (
                <Stop
                  key={offset}
                  offset={offset}
                  stopColor={isDark ? OSCURO[mancha.id] : mancha.claro}
                  stopOpacity={
                    (isDark ? mancha.opacidad * 0.7 : mancha.opacidad) * factor
                  }
                />
              ))}
            </RadialGradient>
          ))}
        </Defs>
        {MANCHAS.map((mancha) => (
          <Rect
            key={mancha.id}
            x={0}
            y={0}
            width={width}
            height={alto}
            fill={`url(#${mancha.id})`}
          />
        ))}
      </Svg>
      {/* Remate: el resplandor se apaga del todo hacia el fondo, sin dejar borde */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${base}00`, base]}
        locations={[0, 1]}
        style={[estilos.remate, { top: alto * 0.1, height: alto * 0.9 }]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { position: "absolute", left: 0, right: 0, bottom: 0 },
  mezcla: { position: "absolute", top: 0, left: 0, right: 0 },
  remate: { position: "absolute", left: 0, right: 0 },
});
