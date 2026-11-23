import MaskedViewOriginal, {
  type MaskedViewProps,
} from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useMemo, useState, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";
import { CON_DESENFOQUE } from "@/features/busqueda/components/PildoraCristal";
import {
  ALTO_PILDORA_ICONO,
  FilaPildoras,
  PildoraOpcion,
} from "@/features/busqueda/components/PildoraOpcion";
import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { CATEGORY_IMAGES_CRISTAL } from "@/features/shared/constants";
import { HomeHeader } from "./HomeHeader";

/** Separación con el borde de arriba de lo que queda fijo (la usa la búsqueda) */
export const MARGEN_FIJO = 8;
/** Alto de la cabecera (logo y botones de 45 con 5 de aire arriba) */
export const ALTO_CABECERA = 50;
/** Lo que la fila de píldoras ocupa: su alto más el aire de arriba y abajo de `FilaPildoras` */
export const ALTO_FILA_PILDORAS = 8 + ALTO_PILDORA_ICONO + 8;
/** Todo lo fijo de arriba (sin la barra de estado): la cabecera y, debajo, las píldoras */
export const ALTO_FIJO = ALTO_CABECERA + ALTO_FILA_PILDORAS;
/** Scroll en el que la neblina termina de aparecer (como en las páginas legales) */
const TRAMO_NEBLINA = 24;
const EASE = Easing.out(Easing.cubic);
/** Las píldoras bajan desde detrás de la cabecera; al irse, solo se desvanecen */
const ENTRADA_PILDORAS = FadeInDown.duration(220)
  .easing(EASE)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -8 }] });
const SALIDA_PILDORAS = FadeOut.duration(160).easing(EASE);

/** Lo que la neblina baja de más, además de su cola normal */
const EXTRA_NEBLINA = 16;
/**
 * Velo del color de fondo en muchas capas: muy blanco desde arriba hasta el inicio de las
 * píldoras (de `OPACIDAD_ARRIBA` a `OPACIDAD_PILDORAS`, apenas baja) y de ahí se desvanece a
 * nada, con una curva que arranca y termina despacio (sin escalones ni final recto)
 */
const OPACIDAD_ARRIBA = 0.98;
const OPACIDAD_PILDORAS = 0.92;
const CAPAS_VELO = 18;
/** `inicioPildoras`: dónde empiezan las píldoras, como fracción del alto del velo */
function veloPorCapas(rgb: string, inicioPildoras: number) {
  const colores: string[] = [];
  const posiciones: number[] = [];
  const curva = (t: number) => t * t * (3 - 2 * t);
  // Tramo de arriba: casi igual de blanco hasta las píldoras
  for (let i = 0; i < CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const opacidad =
      OPACIDAD_ARRIBA - (OPACIDAD_ARRIBA - OPACIDAD_PILDORAS) * curva(t);
    colores.push(`rgba(${rgb},${opacidad.toFixed(3)})`);
    posiciones.push(inicioPildoras * t);
  }
  // Desde las píldoras: se desvanece hasta nada
  for (let i = 0; i <= CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const opacidad = OPACIDAD_PILDORAS * (1 - curva(t));
    colores.push(`rgba(${rgb},${opacidad.toFixed(3)})`);
    posiciones.push(inicioPildoras + (1 - inicioPildoras) * t);
  }
  return {
    colores: colores as unknown as readonly [string, string, ...string[]],
    posiciones: posiciones as unknown as readonly [number, number, ...number[]],
  };
}

// Sus tipos son de una versión anterior de React (componente de clase): mismo componente, tipado
const MaskedView =
  MaskedViewOriginal as unknown as ComponentType<MaskedViewProps>;

/** Intensidad del desenfoque donde es más fuerte (la hora y la cabecera) */
const INTENSIDAD_DESENFOQUE = 22;
/** Debajo de las píldoras, lo que baja el desvanecido del desenfoque (nada: termina en ellas) */
const COLA_DESENFOQUE = 0;

/**
 * Lo de arriba del inicio: la cabecera (logo, búsqueda y campana), fija siempre, y debajo las
 * categorías en píldoras, que salen al pasar las categorías cuadradas de la lista. El contenido pasa por debajo; al empezar el scroll aparece un
 * desenfoque progresivo (una máscara en degradado, sin capas) que cubre desde la hora hasta un poco debajo de las píldoras: lo que
 * pasa por detrás se ve borroso y con su color, con un velo claro suave para que se lea la
 * cabecera. En Android (sin desenfoque en la app) es la neblina de color. En reposo no hay nada.
 */
export const CabeceraInicio = memo(function CabeceraInicio({
  scrollY,
  arriba,
  umbralPildoras,
  activeCategory,
  onToggleCategory,
  onBuscar,
}: {
  scrollY: SharedValue<number>;
  /** Alto de la barra de estado: todo va debajo de ella */
  arriba: number;
  /** Scroll desde el que salen las píldoras (ya pasaron las categorías cuadradas); 0 sin medir */
  umbralPildoras: SharedValue<number>;
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
  onBuscar: () => void;
}) {
  const { isDark } = useAppTheme();
  const altoFijo = arriba + ALTO_FIJO;
  const altoNeblina = altoFijo + COLA_NEBLINA + EXTRA_NEBLINA;
  const velo = useMemo(
    () =>
      veloPorCapas(
        isDark ? "22,22,22" : "252,252,252",
        (arriba + ALTO_CABECERA) / (altoFijo + COLA_DESENFOQUE),
      ),
    [isDark, arriba, altoFijo],
  );

  // Las píldoras salen al pasar las categorías cuadradas de la lista y se van al regresar.
  // Solo avisa a React cuando cambia de lado del umbral, nunca en cada cuadro del scroll
  const [conPildoras, setConPildoras] = useState(false);
  const pildoras = useSharedValue(0);
  useAnimatedReaction(
    () => umbralPildoras.get() > 0 && scrollY.get() > umbralPildoras.get(),
    (mostrar, antes) => {
      if (mostrar === antes) return;
      pildoras.set(
        withTiming(mostrar ? 1 : 0, { duration: 220, easing: EASE }),
      );
      scheduleOnRN(setConPildoras, mostrar);
    },
  );

  // Sin píldoras, la neblina sube y termina justo debajo de la cabecera
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(scrollY.get() / TRAMO_NEBLINA, 0), 1),
    transform: [{ translateY: -(1 - pildoras.get()) * ALTO_FILA_PILDORAS }],
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.neblina, { height: altoNeblina }, estiloNeblina]}
      >
        {CON_DESENFOQUE ? (
          <>
            {/* Un solo desenfoque con una máscara en degradado: completo hasta media fila de
                píldoras y de ahí se desvanece suave hasta el final de ellas, sin escalones ni orillas */}
            <MaskedView
              style={[
                styles.capaDesenfoque,
                { height: altoFijo + COLA_DESENFOQUE },
              ]}
              maskElement={
                <LinearGradient
                  colors={["#000000", "#000000", "rgba(0,0,0,0)"]}
                  locations={[
                    0,
                    (altoFijo - ALTO_FILA_PILDORAS / 2) /
                      (altoFijo + COLA_DESENFOQUE),
                    1,
                  ]}
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
            {/* Velo blanco por capas: más fuerte en la hora y se desvanece muy gradual hasta
                nada debajo de las píldoras, sin que se note ninguna línea */}
            <LinearGradient
              colors={velo.colores}
              locations={velo.posiciones}
              style={[
                styles.capaDesenfoque,
                { height: altoFijo + COLA_DESENFOQUE },
              ]}
            />
          </>
        ) : (
          // Tapa casi por completo hasta las píldoras y de ahí se desvanece
          <Neblina
            style={StyleSheet.absoluteFill}
            corte={(altoFijo - ALTO_FILA_PILDORAS / 2) / altoNeblina}
          />
        )}
      </Animated.View>
      <View pointerEvents="box-none" style={[styles.capa, { top: arriba }]}>
        <View style={styles.cabecera}>
          <HomeHeader onBuscar={onBuscar} />
        </View>
        {conPildoras ? (
          <Animated.View entering={ENTRADA_PILDORAS} exiting={SALIDA_PILDORAS}>
            <FilaPildoras>
              {CATEGORIES.map((category) => (
                <PildoraOpcion
                  key={category.id}
                  valor={category.id}
                  etiqueta={category.label}
                  icono={CATEGORY_IMAGES_CRISTAL[category.id]}
                  seleccionado={activeCategory === category.id}
                  isDark={isDark}
                  onPress={onToggleCategory}
                />
              ))}
            </FilaPildoras>
          </Animated.View>
        ) : null}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  capa: { position: "absolute", left: 0, right: 0 },
  // La cabecera con el mismo ancho y márgenes que la lista del inicio
  cabecera: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  // Del borde de arriba de la pantalla hasta un poco más abajo de las píldoras
  neblina: { position: "absolute", top: 0, left: 0, right: 0 },
  capaDesenfoque: { position: "absolute", top: 0, left: 0, right: 0 },
});
