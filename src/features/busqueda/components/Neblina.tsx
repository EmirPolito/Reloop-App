import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { Platform, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";

const ES_ANDROID = Platform.OS === "android";

/**
 * Un poco más blanca que el fondo de la app (#FAFAFA) en claro; el fondo en oscuro. En
 * Android, el mismo fondo: ahí no hay desenfoque y el tono más blanco se veía como una
 * tarjeta detrás de la hora
 */
const RGB_CLARO = ES_ANDROID ? "250,250,250" : "252,252,252";
const RGB_OSCURO = "22,22,22";

/** Lo que baja la neblina por debajo de las píldoras: apenas un poco, ya casi transparente */
export const COLA_NEBLINA = 20;

/**
 * Qué tanto tapa a la altura del buscador (arriba, en la hora, tapa por completo). En
 * Android, sin desenfoque, el bloque sólido se veía blanco y nublado: ahí tapa como el velo
 * de iOS (más arriba, menos a la altura del buscador) y deja ver un poco lo de detrás
 */
const OPACIDAD_ARRIBA = ES_ANDROID ? 0.78 : 1;
const OPACIDAD_BUSCADOR = ES_ANDROID ? 0.62 : 1.7;
// const OPACIDAD_BUSCADOR = 0.95;

/** Capas del desvanecido: muchas, para que no se vea ningún escalón ni el final recto */
const CAPAS = 15;
// const CAPAS = 14;

/**
 * Neblina detrás de los buscadores flotantes: el color del fondo desvaneciéndose por capas de
 * arriba hacia abajo, sin un bloque sólido. Tapa por completo en la hora, casi por completo a
 * la altura del buscador (`corte`, fracción del alto) y de ahí baja por capas a lo largo de
 * las píldoras hasta desaparecer un poco debajo de ellas, con una curva que arranca y termina
 * despacio para que el final no se vea recto.
 */
export function Neblina({
  style,
  corte = 0.6,
}: {
  style: StyleProp<ViewStyle>;
  corte?: number;
}) {
  const { isDark } = useAppTheme();
  const rgb = isDark ? RGB_OSCURO : RGB_CLARO;

  const { colors, locations } = useMemo(() => {
    const inicio = Math.min(Math.max(corte, 0.05), 0.95);
    const colores = [
      `rgba(${rgb},${OPACIDAD_ARRIBA})`,
      `rgba(${rgb},${OPACIDAD_BUSCADOR})`,
    ];
    const posiciones = [0, inicio];
    for (let i = 1; i <= CAPAS; i++) {
      const t = i / CAPAS;
      const restante = OPACIDAD_BUSCADOR * (1 - t * t * (3 - 2 * t));
      colores.push(`rgba(${rgb},${restante.toFixed(3)})`);
      posiciones.push(inicio + (1 - inicio) * t);
    }
    return {
      colors: colores as unknown as readonly [string, string, ...string[]],
      locations: posiciones as unknown as readonly [
        number,
        number,
        ...number[],
      ],
    };
  }, [rgb, corte]);

  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      locations={locations}
      style={style}
    />
  );
}
