import MaskedViewOriginal, {
  type MaskedViewProps,
} from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  memo,
  useCallback,
  useMemo,
  useState,
  type ComponentType,
} from "react";
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

import { BotonBarra } from "@/components/ui/BotonBarra";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";
import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";
import { CON_DESENFOQUE } from "@/features/busqueda/components/PildoraCristal";
import {
  ALTO_PILDORA_ICONO,
  FilaPildoras,
  PildoraOpcion,
} from "@/features/busqueda/components/PildoraOpcion";
import { ETIQUETA_BUSQUEDA } from "@/features/busqueda/frasesBusqueda";
import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { CATEGORY_IMAGES_CRISTAL } from "@/features/shared/constants";
import { IconoBusqueda } from "./components/IconosTarjeta";
import { useEstilosInicio } from "./estilos";

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
/** Lo que hay que moverse en un sentido para que cuente como cambio de dirección */
const UMBRAL_DIRECCION = 6;
/** Sin píldoras, lo que la neblina baja de más bajo la cabecera */
const BAJO_SIN_PILDORAS = 24;
/** Las píldoras de categorías del header, apagadas por ahora (en `true` vuelven a salir) */
const PILDORAS_ACTIVAS = false;
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
const OPACIDAD_ARRIBA = 0.76;
const OPACIDAD_PILDORAS = 0.6;
const CAPAS_VELO = 32;
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

/** Intensidad de cada capa de desenfoque (arriba se suman todas: la hora y el logo) */
const INTENSIDAD_CAPA = 6;
/**
 * Capas de desenfoque apiladas, de la más larga a la más corta (fracciones del alto):
 * cada una es completa hasta `opaca` y se desvanece hasta `fin`. Arriba se juntan todas
 * (más borroso) y hacia abajo van quedando menos, así el desenfoque baja por capas
 */
const CAPAS_DESENFOQUE = [
  { opaca: 0.7, fin: 1 },
  { opaca: 0.52, fin: 0.82 },
  { opaca: 0.34, fin: 0.64 },
  { opaca: 0.16, fin: 0.46 },
] as const;
/** Debajo de las píldoras, lo que baja el desvanecido del desenfoque (nada: termina en ellas) */
const COLA_DESENFOQUE = 0;

/**
 * La fila de arriba: el logo y, a la derecha, la búsqueda (lleva al módulo de búsqueda) a la
 * izquierda de la campana, con los mismos botones de los demás módulos (`BotonBarra`)
 */
const BarraLogo = memo(function BarraLogo({
  onBuscar,
}: {
  onBuscar: () => void;
}) {
  const { isDark } = useAppTheme();
  const estilos = useEstilosInicio();
  return (
    <View className="w-full flex-row items-center justify-between gap-3">
      <View className="flex-1 min-w-0 flex-row items-center gap-2">
        <Image
          accessibilityLabel="Logo ReLoop"
          source={require("@/assets/images/logos-reloop/logoo.png")}
          contentFit="contain"
          style={estilos.logo}
        />
      </View>
      <View className="flex-row items-center gap-2">
        {/* Más blanco: sobre el desenfoque de la cabecera el cristal se veía gris */}
        <BotonBarra
          etiqueta={ETIQUETA_BUSQUEDA}
          onPress={onBuscar}
          opaco={!isDark}
        >
          <IconoBusqueda
            size={23}
            color={isDark ? "#FFFFFF" : "#23242C"}
            grosorExtra={0.5}
          />
        </BotonBarra>
        <NotificationBellButton />
      </View>
    </View>
  );
});

/**
 * Lo fijo de arriba del inicio: la fila del logo y los botones y, debajo, las categorías en
 * píldoras (apagadas por ahora con `PILDORAS_ACTIVAS`). Al hacer scroll, lo que pasa por detrás
 * se ve borroso con un velo blanco encima (en Android, solo la neblina de color).
 */
export const CabeceraInicio = memo(function CabeceraInicio({
  scrollY,
  arrastre,
  arriba,
  umbralPildoras,
  activeCategory,
  onToggleCategory,
  onBuscar,
}: {
  scrollY: SharedValue<number>;
  /** 1 mientras el dedo o su inercia mueven la lista (los saltos por filtrar no cuentan) */
  arrastre: SharedValue<number>;
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

  // Las píldoras salen al bajar, ya pasadas las categorías cuadradas de la lista, y se
  // esconden al hacer scroll hacia arriba (o al regresar hasta las categorías).
  // Solo avisa a React cuando cambia, nunca en cada cuadro del scroll
  const [conPildoras, setConPildoras] = useState(false);
  const pildoras = useSharedValue(0);
  // Dónde cambió de dirección el scroll por última vez, y hacia dónde va (1 abajo, -1 arriba)
  const giro = useSharedValue(0);
  const direccion = useSharedValue(1);
  // 1 tras elegir una categoría en las píldoras: se quedan a la vista aunque la lista cambie
  // de alto (y el scroll brinque) hasta que la persona haga scroll hacia arriba
  const fijadas = useSharedValue(0);
  // La dirección cambia solo después de moverse `UMBRAL_DIRECCION` en el otro sentido (un
  // temblor del dedo no hace que aparezcan y se escondan) y solo si lo mueve la persona: el
  // salto del scroll al filtrar no cuenta como subir
  useAnimatedReaction(
    () => scrollY.get(),
    (y) => {
      if (arrastre.get() !== 1) {
        giro.set(y);
        return;
      }
      const desde = giro.get();
      if (direccion.get() === 1) {
        if (y > desde) giro.set(y);
        else if (desde - y > UMBRAL_DIRECCION) {
          direccion.set(-1);
          giro.set(y);
          fijadas.set(0);
        }
      } else if (y < desde) giro.set(y);
      else if (y - desde > UMBRAL_DIRECCION) {
        direccion.set(1);
        giro.set(y);
      }
    },
  );
  useAnimatedReaction(
    () =>
      PILDORAS_ACTIVAS &&
      (fijadas.get() === 1 ||
        (umbralPildoras.get() > 0 &&
          scrollY.get() > umbralPildoras.get() &&
          direccion.get() === 1)),
    (mostrar, antes) => {
      if (mostrar === antes) return;
      pildoras.set(
        withTiming(mostrar ? 1 : 0, { duration: 220, easing: EASE }),
      );
      scheduleOnRN(setConPildoras, mostrar);
    },
  );

  // Elegir una categoría desde las píldoras las deja fijas (no se esconden por el cambio de
  // la lista); solo un scroll hacia arriba las vuelve a esconder
  const alElegirCategoria = useCallback(
    (category: CategoryId) => {
      fijadas.set(1);
      direccion.set(1);
      onToggleCategory(category);
    },
    [fijadas, direccion, onToggleCategory],
  );

  // Sin píldoras, la neblina sube pero no del todo: baja `BAJO_SIN_PILDORAS` más que la
  // cabecera para que se sienta. Con píldoras termina en el borde de abajo de ellas
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(scrollY.get() / TRAMO_NEBLINA, 0), 1),
    transform: [
      {
        translateY:
          -(1 - pildoras.get()) * (ALTO_FILA_PILDORAS - BAJO_SIN_PILDORAS),
      },
    ],
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.neblina, { height: altoNeblina }, estiloNeblina]}
      >
        {CON_DESENFOQUE ? (
          <>
            {/* Desenfoque por capas: cada una con su máscara en degradado, más cortas
                conforme se apilan, así es más fuerte arriba y se desvanece hacia abajo */}
            {CAPAS_DESENFOQUE.map(({ opaca, fin }) => (
              <MaskedView
                key={fin}
                style={[
                  styles.capaDesenfoque,
                  { height: altoFijo + COLA_DESENFOQUE },
                ]}
                maskElement={
                  <LinearGradient
                    colors={["#000000", "#000000", "rgba(0,0,0,0)"]}
                    locations={[0, opaca, fin]}
                    style={StyleSheet.absoluteFill}
                  />
                }
              >
                <BlurView
                  intensity={INTENSIDAD_CAPA}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
              </MaskedView>
            ))}
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
          <BarraLogo onBuscar={onBuscar} />
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
                  onPress={alElegirCategoria}
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
