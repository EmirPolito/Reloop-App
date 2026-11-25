import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Text as NativeText,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import { EASE_OUT_CUBIC } from "@/constants/motion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import {
  claveEnTarjeta,
  nombrePropio,
  ultimos4,
  type ColorVista,
  type Tarjeta,
} from "../formatoTarjeta";
import { OjoIcon, OjoTachadoIcon } from "./IconosTarjetas";
import { PROPORCION_TARJETA, TarjetaBancaria } from "./TarjetaBancaria";

/* Medidas de diseño (ancho 300): todo se escala junto con `escala` */
const ANCHO = 300;
/** Poco margen: la tarjeta casi del ancho de la funda */
const MARGEN_TARJETA = 12;
const ANCHO_TARJETA = ANCHO - MARGEN_TARJETA * 2;
const ALTO_TARJETA = ANCHO_TARJETA / PROPORCION_TARJETA;
/** Cuánto asoma cada tarjeta de atrás sobre la de enfrente (pirámide) */
const PICO = 13;
/** Hasta dónde baja la tarjeta antes de que la tape la funda, en las orillas */
const BOCA_FUNDA = 96;
/** Lo que baja la curva del centro de la funda */
const CURVA = 32;
const ALTO_FUNDA = 118;
/** Lo que sube la tarjeta al alzarla: queda entera sobre la funda */
export const ALZADO = ALTO_TARJETA - BOCA_FUNDA + 8;
const MAX_VISIBLES = 3;

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

/** La funda sigue el tema: blanca en claro y negra en oscuro */
function coloresFunda(isDark: boolean) {
  return isDark
    ? {
        fondo: "#0D0D0F",
        borde: "#2C2C31",
        costura: "#45454C",
        respaldo: "#121214",
        texto: "#FFFFFF",
        suave: "#9A9AA2",
        ojo: "#D4D4D8",
      }
    : {
        fondo: "#FFFFFF",
        borde: "#E4E4E7",
        costura: "#C9C9CF",
        respaldo: "#FAFAFA",
        texto: "#111113",
        suave: "#8A8A90",
        ojo: "#56565C",
      };
}

/** Una tarjeta como se dibuja (la nueva va en gris mientras no tiene diseño) */
export type TarjetaVista = Omit<Tarjeta, "color"> & { color: ColorVista };

const MUESTRA: TarjetaVista = {
  id: "muestra",
  institucion: "",
  clave: "",
  beneficiario: "",
  color: "gris",
};

/** "•••• 0806", o la clave completa con espacios */
function claveEnFunda(clave: string, abierta: boolean): string {
  if (abierta && clave) return claveEnTarjeta(clave, true);
  return `•••• ${ultimos4(clave)}`;
}

/**
 * Contorno de la funda: recta en las orillas y con una curva hacia abajo en el centro, para
 * que se vea más de la tarjeta. `m` lo mete hacia adentro (la costura punteada).
 */
function rutaFunda(m: number): string {
  const w = ANCHO;
  const h = ALTO_FUNDA;
  const r = 24 - m * 0.6;
  const [l, t, rr, b] = [m, m, w - m, h - m];
  const x1 = w * 0.22;
  const xm = w * 0.45;
  const x2 = w * 0.68;
  const k = (xm - x1) * 0.55;
  const fondo = t + CURVA;
  return [
    `M${l},${t + r}`,
    `Q${l},${t} ${l + r},${t}`,
    `L${x1},${t}`,
    `C${x1 + k},${t} ${xm - k},${fondo} ${xm},${fondo}`,
    `C${xm + k},${fondo} ${x2 - k},${t} ${x2},${t}`,
    `L${rr - r},${t}`,
    `Q${rr},${t} ${rr},${t + r}`,
    `L${rr},${b - r}`,
    `Q${rr},${b} ${rr - r},${b}`,
    `L${l + r},${b}`,
    `Q${l},${b} ${l},${b - r}`,
    "Z",
  ].join(" ");
}
const FUNDA = rutaFunda(0);
const COSTURA = rutaFunda(9);

/** Movimiento suave y sin rebote: la tarjeta se acomoda sola, sin brincos */
const RESORTE = { duration: 520, dampingRatio: 1 } as const;
/** Lo que baja la de enfrente para meterse en la funda antes de pasar atrás */
const HUNDIDO = 112;
const BAJAR = { duration: 230, easing: Easing.bezier(0.4, 0, 1, 1) };
const SUBIR = { duration: 420, easing: EASE_OUT_CUBIC };
/** Lugar arriba del recorte para la tarjeta alzada */
const RESERVA = ALZADO + 40;
const TEXTOS = FadeIn.duration(260).easing(EASE_OUT_CUBIC);

/**
 * Una tarjeta de la billetera. Se queda montada al cambiar de lugar (no parpadea): su `nivel`
 * (0 enfrente, 1 y 2 detrás; más allá, oculta) se anima con un resorte. Cuando deja de ir
 * enfrente, primero baja dentro de la funda y luego sube por detrás.
 */
function CartaAnimada({
  tarjeta,
  nivel,
  abierta,
  arriba,
}: {
  tarjeta: TarjetaVista;
  nivel: number;
  abierta: boolean;
  /** Dónde va la de enfrente (deja lugar arriba para las de atrás) */
  arriba: number;
}) {
  const nivelAnimado = useSharedValue(nivel);
  const hundido = useSharedValue(0);
  const alzado = useSharedValue(nivel === 0 && abierta ? 1 : 0);
  const nivelPrevio = useRef(nivel);

  useEffect(() => {
    // Deja de ir enfrente: se hunde en la funda y vuelve a salir ya detrás
    if (nivelPrevio.current === 0 && nivel > 0) {
      hundido.set(withSequence(withTiming(1, BAJAR), withTiming(0, SUBIR)));
    }
    // La que avanza espera a que la de enfrente se hunda: así no se cruzan a la vez
    const avanza = nivel < nivelPrevio.current;
    nivelPrevio.current = nivel;
    nivelAnimado.set(
      avanza
        ? withDelay(BAJAR.duration * 0.7, withSpring(nivel, RESORTE))
        : withSpring(nivel, RESORTE),
    );
  }, [nivel, nivelAnimado, hundido]);

  useEffect(() => {
    alzado.set(withSpring(nivel === 0 && abierta ? 1 : 0, RESORTE));
  }, [nivel, abierta, alzado]);

  const estilo = useAnimatedStyle(() => {
    const n = nivelAnimado.get();
    const enPila = Math.min(n, MAX_VISIBLES - 1);
    return {
      // Opacas siempre (nada se ve a través); solo las que pasan de tres se ocultan detrás
      opacity: Math.min(Math.max(MAX_VISIBLES - n, 0), 1),
      transform: [
        {
          translateY:
            -enPila * PICO + hundido.get() * HUNDIDO - alzado.get() * ALZADO,
        },
        { scale: (ANCHO_TARJETA - enPila * 22) / ANCHO_TARJETA },
      ],
    };
  });

  // Las de atrás se oscurecen un poco (en lugar de volverse transparentes)
  const estiloSombra = useAnimatedStyle(() => ({
    opacity: Math.min(nivelAnimado.get(), MAX_VISIBLES - 1) * 0.14,
  }));

  return (
    <Animated.View style={[styles.carta, { top: arriba }, estilo]}>
      <TarjetaBancaria
        institucion={tarjeta.institucion}
        clave={tarjeta.clave}
        beneficiario={tarjeta.beneficiario}
        color={tarjeta.color}
        ancho={ANCHO_TARJETA}
        claveVisible={nivel === 0 && abierta}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.sombraCarta, estiloSombra]}
      />
    </Animated.View>
  );
}

/**
 * El orden en que se dibujan: la de enfrente al final (encima). La que acaba de dejar de ir
 * enfrente sigue encima mientras se hunde en la funda, y luego pasa atrás (ya oculta, sin
 * que se note el cambio).
 */
function useOrdenDibujo(ids: readonly string[]): string[] {
  const frente = ids[0];
  const [encima, setEncima] = useState(frente);
  const [frenteAntes, setFrenteAntes] = useState(frente);
  if (frente !== frenteAntes) {
    setFrenteAntes(frente);
    // Si la de antes sigue en la billetera, se queda encima mientras baja
    if (!ids.includes(encima)) setEncima(frente);
  }
  useEffect(() => {
    if (encima === frente) return;
    const t = setTimeout(() => setEncima(frente), BAJAR.duration);
    return () => clearTimeout(t);
  }, [encima, frente]);

  const atrasPrimero = [...ids].reverse().filter((id) => id !== encima);
  return ids.includes(encima) ? [...atrasPrimero, encima] : atrasPrimero;
}

/**
 * Billetera con funda: la tarjeta de enfrente asoma por arriba y, si hay más, las de atrás
 * asoman en pirámide (hasta tres). En la funda, a la izquierda el ojo y el beneficiario; a la
 * derecha la institución y la clave. Abierta (con el ojo), la tarjeta sube y se ven los datos.
 */
export function Billetera({
  tarjetas,
  escala = 1,
  abierta = false,
  onAlternarAbierta,
  onTocar,
  etiquetaTocar,
  onEliminar,
}: {
  /** La primera va enfrente; si no hay ninguna se dibuja una de muestra */
  tarjetas: readonly TarjetaVista[];
  escala?: number;
  /** La tarjeta alzada y la clave completa */
  abierta?: boolean;
  /** El ojo. Sin esto es solo un dibujo (p. ej., la billetera pequeña del chat) */
  onAlternarAbierta?: () => void;
  /** Tocar la billetera (p. ej., para pasar a la de atrás). El ojo va aparte, no anidado */
  onTocar?: () => void;
  etiquetaTocar?: string;
  /** La basura roja, dentro de la funda a la derecha del beneficiario */
  onEliminar?: () => void;
}) {
  const { isDark } = useAppTheme();
  const c = coloresFunda(isDark);
  const lista = tarjetas.length > 0 ? tarjetas : [MUESTRA];
  const frente = lista[0];
  const arriba = Math.min(lista.length - 1, MAX_VISIBLES - 1) * PICO;
  const alto = arriba + BOCA_FUNDA + ALTO_FUNDA;
  const orden = useOrdenDibujo(lista.map((t) => t.id));

  const Ojo = abierta ? OjoTachadoIcon : OjoIcon;

  return (
    <View style={{ width: ANCHO * escala, height: alto * escala }}>
      <View
        style={{
          width: ANCHO,
          height: alto,
          transformOrigin: "top left",
          transform: [{ scale: escala }],
        }}
      >
        {/* El respaldo de la funda, detrás de las tarjetas */}
        <View
          style={[
            styles.respaldo,
            {
              top: arriba + 18,
              borderColor: c.borde,
              backgroundColor: c.respaldo,
            },
          ]}
        />

        {/* Recorte en la orilla de abajo de la funda: al hundirse, la tarjeta no se asoma por
            debajo. Arriba deja lugar de sobra para la tarjeta alzada */}
        <View
          pointerEvents="none"
          style={[
            styles.recorte,
            { height: RESERVA + arriba + BOCA_FUNDA + ALTO_FUNDA - 4 },
          ]}
        >
          <View style={{ marginTop: RESERVA }}>
            {/* Cada tarjeta en su lugar de la pila: la de enfrente se dibuja al final */}
            {orden.map((id) => {
              const nivel = lista.findIndex((t) => t.id === id);
              return (
                <CartaAnimada
                  key={id}
                  tarjeta={lista[nivel]}
                  nivel={nivel}
                  abierta={abierta}
                  arriba={arriba}
                />
              );
            })}
          </View>
        </View>

        {/* La funda, encima de las tarjetas */}
        <View
          style={{
            position: "absolute",
            top: arriba + BOCA_FUNDA,
            left: 0,
            width: ANCHO,
            height: ALTO_FUNDA,
          }}
        >
          <Svg
            width={ANCHO}
            height={ALTO_FUNDA}
            style={StyleSheet.absoluteFill}
          >
            <Path d={FUNDA} fill={c.fondo} stroke={c.borde} strokeWidth={1} />
            <Path
              d={COSTURA}
              fill="none"
              stroke={c.costura}
              strokeWidth={1}
              strokeDasharray="5 4"
            />
          </Svg>

          {onAlternarAbierta ? null : (
            <View style={styles.ojo}>
              <Ojo size={21} color={c.ojo} />
            </View>
          )}

          {/* Los datos de la funda cambian con un fundido corto al pasar a otra tarjeta */}
          <Animated.View
            key={frente.id}
            entering={TEXTOS}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {/* Derecha: la institución y, debajo (ya pasada la curva), la clave */}
            <View style={styles.derecha}>
              <Text
                numberOfLines={1}
                style={[styles.institucion, { color: c.suave }]}
              >
                {frente.institucion || "INSTITUCIÓN"}
              </Text>
              <NativeText
                numberOfLines={1}
                style={[styles.clave, { color: abierta ? c.texto : c.suave }]}
              >
                {claveEnFunda(frente.clave, abierta)}
              </NativeText>
            </View>

            {/* Izquierda, abajo del ojo: el beneficiario, con todo el ancho */}
            <Text
              numberOfLines={1}
              style={[
                styles.beneficiario,
                { color: c.texto },
                // Deja lugar a la basura
                onEliminar ? { right: 70 } : null,
              ]}
            >
              {frente.beneficiario
                ? nombrePropio(frente.beneficiario)
                : "Beneficiario"}
            </Text>
          </Animated.View>
        </View>

        {onTocar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={etiquetaTocar}
            onPress={onTocar}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {onAlternarAbierta ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              abierta ? "Ocultar los datos" : "Mostrar los datos"
            }
            onPress={onAlternarAbierta}
            hitSlop={12}
            style={[styles.ojo, { top: arriba + BOCA_FUNDA + 22 }]}
          >
            <Ojo size={21} color={c.ojo} />
          </Pressable>
        ) : null}
        {onEliminar ? (
          <Animated.View
            entering={TEXTOS}
            style={[
              styles.eliminar,
              { top: arriba + BOCA_FUNDA + ALTO_FUNDA - 50 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar esta tarjeta"
              onPress={onEliminar}
              hitSlop={8}
              style={({ pressed }) => [
                styles.botonEliminar,
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <Ionicons name="trash-outline" size={19} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eliminar: { position: "absolute", right: 22 },
  botonEliminar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5484D",
    alignItems: "center",
    justifyContent: "center",
  },
  recorte: {
    position: "absolute",
    top: -RESERVA,
    left: 0,
    width: ANCHO,
    overflow: "hidden",
  },
  sombraCarta: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    borderRadius: 14 * (ANCHO_TARJETA / 256),
  },
  carta: {
    position: "absolute",
    left: MARGEN_TARJETA,
    // Al encogerse detrás, la orilla de arriba se queda en su lugar
    transformOrigin: "top",
  },
  respaldo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
  },
  ojo: { position: "absolute", left: 30, top: 22 },
  derecha: {
    position: "absolute",
    right: 24,
    top: 20,
    alignItems: "flex-end",
    gap: 16,
  },
  institucion: {
    maxWidth: 92,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "600",
    textAlign: "right",
  },
  clave: { fontFamily: MONO, fontSize: 12, letterSpacing: 0.3 },
  beneficiario: {
    position: "absolute",
    left: 26,
    right: 24,
    bottom: 16,
    fontSize: 18,
    fontWeight: "600",
  },
});
