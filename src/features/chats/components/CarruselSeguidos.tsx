import { memo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Lado del avatar del centro */
const LADO = 105;
/** Ancho que ocupa cada avatar en la fila (el paso entre uno y otro) */
const PASO = 96;
/**
 * Forma de V invertida (como un pino o una flecha hacia arriba): según la distancia al centro
 * (0, 1, 2, 3 lugares), cada avatar se ve más chico y más abajo que el anterior.
 */
const DISTANCIAS = [0, 1, 2, 3];
const ESCALAS = [1, 0.66, 0.54, 0.46];
const BAJADAS = [0, 26, 46, 62];
/** Empuje hacia afuera: abre bien el espacio alrededor del centro y compacta un poco hacia las orillas */
const EMPUJES_X = [0, 18, 8, -4];
/** Tamaño del nombre de los de los lados respecto al del centro */
const ESCALA_NOMBRE_LATERAL = 0.88;

/** Con el dedo casi quieto (px/s), los movimientos menores a ZONA_MUERTA (px) se ignoran */
const DEDO_QUIETO = 60;
const ZONA_MUERTA = 6;
/** Pasado el primero o el último, la fila se estira con resistencia */
const RESISTENCIA_ORILLA = 0.35;
/** Cuánto cuenta la velocidad al soltar para decidir en cuál avatar se detiene (s) */
const PROYECCION = 0.18;
/** Resorte al soltar: hereda la velocidad del dedo y se asienta suave en el avatar */
const RESORTE = { damping: 24, stiffness: 190, mass: 0.9 } as const;

/**
 * Personas que sigo, en una fila en forma de V invertida que se detiene con una al centro: la
 * del centro se ve más grande y más alzada, y cada una hacia los lados, más chica y más abajo.
 * Al abrir se centra la de en medio, así hay una a cada lado. Con insignia si tienen Premium.
 * Tocar a cualquiera abre su chat para escribirle rápido.
 *
 * Se mueve con un gesto propio y no con un ScrollView: el scroll nativo copiaba el pulso del
 * dedo (saltos de 3 a 5 px y de regreso con el dedo quieto) y los avatares temblaban. Aquí,
 * con el dedo casi quieto, los movimientos chicos se ignoran; al moverlo de verdad la fila lo
 * sigue exacto, y al soltar un resorte la lleva al avatar más cercano (según la velocidad).
 */
export const CarruselSeguidos = memo(function CarruselSeguidos({
  ids,
  onEscribir,
}: {
  ids: string[];
  onEscribir: (uid: string, nombre: string) => void;
}) {
  const [ancho, setAncho] = useState(0);
  // La de en medio de la lista va al centro al abrir (con 3: una a cada lado)
  const [medio] = useState(() => Math.floor((ids.length - 1) / 2));
  // Cuánto se recorrió la fila, en px (0 = el primero al centro)
  const recorrido = useSharedValue(medio * PASO);
  const inicio = useSharedValue(0);
  const ultimo = Math.max(0, ids.length - 1) * PASO;
  const relleno = Math.round((ancho - PASO) / 2);

  const arrastre = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    // Al activarse se descuenta lo que el dedo ya recorrió: la fila no brinca
    .onStart((e) => {
      inicio.set(recorrido.get() + e.translationX);
    })
    .onUpdate((e) => {
      let destino = inicio.get() - e.translationX;
      // Pasado el primero o el último: se estira con resistencia
      if (destino < 0) destino *= RESISTENCIA_ORILLA;
      else if (destino > ultimo)
        destino = ultimo + (destino - ultimo) * RESISTENCIA_ORILLA;
      // Dedo casi quieto: el pulso no mueve la fila
      if (
        Math.abs(e.velocityX) < DEDO_QUIETO &&
        Math.abs(destino - recorrido.get()) < ZONA_MUERTA
      ) {
        return;
      }
      recorrido.set(destino);
    })
    .onEnd((e) => {
      const proyectado = recorrido.get() - e.velocityX * PROYECCION;
      const indice = Math.min(
        Math.max(Math.round(proyectado / PASO), 0),
        Math.max(0, ids.length - 1),
      );
      recorrido.set(
        withSpring(indice * PASO, { ...RESORTE, velocity: -e.velocityX }),
      );
    });

  const estiloFila = useAnimatedStyle(() => ({
    transform: [{ translateX: relleno - recorrido.get() }],
  }));

  return (
    <View
      style={styles.carrusel}
      onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))}
    >
      {ancho > 0 ? (
        <GestureDetector gesture={arrastre}>
          <View style={styles.area} collapsable={false}>
            <Animated.View style={[styles.fila, estiloFila]}>
              {ids.map((uid, indice) => (
                <Hueco
                  key={uid}
                  uid={uid}
                  indice={indice}
                  scrollX={recorrido}
                  onPress={onEscribir}
                />
              ))}
            </Animated.View>
          </View>
        </GestureDetector>
      ) : null}
    </View>
  );
});

/** Un lugar de la fila: encoge y baja según qué tan lejos está del centro (la V invertida) */
const Hueco = memo(function Hueco({
  uid,
  indice,
  scrollX,
  onPress,
}: {
  uid: string;
  indice: number;
  scrollX: SharedValue<number>;
  onPress: (uid: string, nombre: string) => void;
}) {
  const { isDark } = useAppTheme();
  const perfil = usePerfilDe(uid);
  const nombre = perfil?.name ?? "";

  const estiloAvatar = useAnimatedStyle(() => {
    const diff = indice - scrollX.get() / PASO;
    const distancia = Math.abs(diff);
    const signo = diff === 0 ? 0 : diff > 0 ? 1 : -1;

    return {
      transform: [
        {
          translateX:
            signo *
            interpolate(distancia, DISTANCIAS, EMPUJES_X, Extrapolation.CLAMP),
        },
        {
          translateY: interpolate(
            distancia,
            DISTANCIAS,
            BAJADAS,
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            distancia,
            DISTANCIAS,
            ESCALAS,
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  // Todos llevan su nombre: sigue al avatar (mismo empuje y bajada) y sube lo que el avatar
  // encoge, así queda pegado debajo de él; en los de los lados se ve un poco más chico
  const estiloNombre = useAnimatedStyle(() => {
    const diff = indice - scrollX.get() / PASO;
    const distancia = Math.abs(diff);
    const signo = diff === 0 ? 0 : diff > 0 ? 1 : -1;
    const escala = interpolate(
      distancia,
      DISTANCIAS,
      ESCALAS,
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        {
          translateX:
            signo *
            interpolate(distancia, DISTANCIAS, EMPUJES_X, Extrapolation.CLAMP),
        },
        {
          translateY:
            interpolate(distancia, DISTANCIAS, BAJADAS, Extrapolation.CLAMP) -
            (LADO / 2) * (1 - escala),
        },
        {
          scale: interpolate(
            distancia,
            [0, 1],
            [1, ESCALA_NOMBRE_LATERAL],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nombre ? `Escribir a ${nombre}` : "Escribir"}
      onPress={() => onPress(uid, nombre)}
      style={styles.hueco}
    >
      <Animated.View style={estiloAvatar}>
        <AvatarVendedor
          ownerId={uid}
          fallbackName={nombre}
          size={LADO}
          ajusteInsignia={{ escala: 0.36, right: 0, bottom: -3 }}
        />
      </Animated.View>
      <Animated.View style={[styles.nombreCaja, estiloNombre]}>
        <Text
          numberOfLines={1}
          style={[styles.nombre, { color: isDark ? "#F1F5F9" : "#101010" }]}
        >
          {nombre.split(" ")[0]}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // Alto para que ningún nombre se corte: el del centro y los de los lados, que bajan más
  // (el de al lado termina unos 34 px bajo el avatar del centro, el siguiente unos 48)
  carrusel: {
    alignSelf: "stretch",
    height: LADO + 52,
    marginTop: 14,
  },
  // Lo que sale por los lados no se ve
  area: { flex: 1, overflow: "hidden" },
  fila: { flexDirection: "row", alignSelf: "flex-start" },
  hueco: { width: PASO, alignItems: "center" },
  // Del ancho del hueco: los nombres de al lado no se enciman
  nombreCaja: { width: PASO, alignItems: "center", marginTop: 8 },
  nombre: { fontFamily: "Inter_500Medium", fontSize: 13.5, lineHeight: 18 },
});
