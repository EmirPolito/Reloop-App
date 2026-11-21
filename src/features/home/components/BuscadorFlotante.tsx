import { memo, useState } from "react";
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

import { PressableSuave } from "@/components/PressableSuave";
import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";
import { PlaceholderRotativo } from "@/features/busqueda/components/PlaceholderRotativo";
import {
  ALTO_PILDORA,
  GROSOR_LUPA,
  PildoraCristal,
} from "@/features/busqueda/components/PildoraCristal";
import {
  ALTO_PILDORA_OPCION,
  FilaPildoras,
  PildoraOpcion,
} from "@/features/busqueda/components/PildoraOpcion";
import { ETIQUETA_BUSQUEDA } from "@/features/busqueda/frasesBusqueda";
import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { IconoBusqueda } from "./IconosTarjeta";

/** Separación con el borde de arriba cuando el buscador ya quedó fijo */
export const MARGEN_FIJO = 8;
/** Del buscador al borde de abajo de las píldoras (8 de separación + su alto) */
const HASTA_PILDORAS = 8 + ALTO_PILDORA_OPCION;
/** Sin píldoras la neblina sube: se desvanece justo debajo del buscador */
const SUBIDA_SIN_PILDORAS = HASTA_PILDORAS - 8;
/** Tramo de scroll en el que aparece la neblina, justo antes de que el buscador quede fijo */
const TRAMO_NEBLINA = 24;

const EASE = Easing.out(Easing.cubic);
/** Las píldoras bajan desde detrás del buscador; al irse, solo se desvanecen */
const ENTRADA_PILDORAS = FadeInDown.duration(220)
  .easing(EASE)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -8 }] });
const SALIDA = FadeOut.duration(160).easing(EASE);

/** Si el buscador de la lista ya llegó arriba y debe verse el fijo (hilo de UI) */
function estaFijo(scroll: number, reposo: number, fijo: number) {
  "worklet";
  return reposo >= 0 && scroll >= reposo - fijo;
}

/** La píldora de cristal del inicio: lupa y frases que rotan; tocarla abre la búsqueda */
const PildoraBuscador = memo(function PildoraBuscador({
  onPress,
}: {
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={ETIQUETA_BUSQUEDA}
      accessibilityHint="Abre la búsqueda"
      onPress={onPress}
    >
      <PildoraCristal>
        <IconoBusqueda
          size={22}
          color={isDark ? "#E3DEED" : "#4A4D57"}
          grosorExtra={GROSOR_LUPA}
        />
        <View style={styles.texto}>
          <PlaceholderRotativo
            activo
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              color: isDark ? "#B3AEC0" : "#828690",
            }}
          />
        </View>
      </PildoraCristal>
    </PressableSuave>
  );
});

/**
 * El buscador dentro de la lista (en la cabecera del inicio): se mueve con el contenido de
 * forma nativa, sin depender de los eventos de scroll, así nunca va desfasado ni brinca.
 * Cuando llega arriba se oculta y en su lugar se ve el fijo (`BuscadorFlotante`).
 */
export const BuscadorEnLista = memo(function BuscadorEnLista({
  scrollY,
  reposoY,
  arriba,
  onPress,
}: {
  scrollY: SharedValue<number>;
  reposoY: SharedValue<number>;
  arriba: number;
  onPress: () => void;
}) {
  const fijo = arriba + MARGEN_FIJO;
  const estilo = useAnimatedStyle(() => ({
    opacity: estaFijo(scrollY.get(), reposoY.get(), fijo) ? 0 : 1,
  }));
  return (
    <Animated.View style={estilo}>
      <PildoraBuscador onPress={onPress} />
    </Animated.View>
  );
});

/**
 * Buscador fijo del inicio: aparece arriba justo cuando el de la lista llega a esa altura (en
 * ese punto los dos coinciden, así que el cambio no se nota). Ya fijo, una neblina cubre desde
 * el borde de arriba de la pantalla (la hora incluida) y difumina lo que pasa por detrás.
 * Cuando la fila de categorías del inicio ya pasó (`scrollY` > `umbralPildoras`), aparecen
 * debajo las categorías en píldoras.
 */
export const BuscadorFlotante = memo(function BuscadorFlotante({
  scrollY,
  reposoY,
  arriba,
  umbralPildoras,
  activeCategory,
  onToggleCategory,
  onPress,
}: {
  scrollY: SharedValue<number>;
  /** Posición del buscador de la lista; negativa mientras no se ha medido */
  reposoY: SharedValue<number>;
  /** Alto de la barra de estado: el buscador queda fijo debajo de ella */
  arriba: number;
  /** Scroll desde el que se muestran las píldoras; 0 o menos mientras no se ha medido */
  umbralPildoras: SharedValue<number>;
  activeCategory: CategoryId | null;
  onToggleCategory: (category: CategoryId) => void;
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  const [fijado, setFijado] = useState(false);
  const [conPildoras, setConPildoras] = useState(false);
  // 1 con las píldoras a la vista: la neblina baja para cubrirlas
  const pildoras = useSharedValue(0);
  const fijo = arriba + MARGEN_FIJO;

  // Solo avisan a React cuando cambia de lado del umbral, no en cada frame del scroll
  useAnimatedReaction(
    () => estaFijo(scrollY.get(), reposoY.get(), fijo),
    (actual, antes) => {
      if (actual !== antes) scheduleOnRN(setFijado, actual);
    },
  );
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

  // Aparece justo antes de que el buscador quede fijo. Sin píldoras sube para terminar justo
  // bajo el buscador (si no, tapaba el contenido donde aún no hay nada)
  const estiloNeblina = useAnimatedStyle(() => {
    const reposo = reposoY.get();
    const avance =
      (scrollY.get() - (reposo - fijo - TRAMO_NEBLINA)) / TRAMO_NEBLINA;
    return {
      opacity: reposo < 0 ? 0 : Math.min(Math.max(avance, 0), 1),
      transform: [{ translateY: -(1 - pildoras.get()) * SUBIDA_SIN_PILDORAS }],
    };
  });

  const estiloBuscador = useAnimatedStyle(() => ({
    opacity: estaFijo(scrollY.get(), reposoY.get(), fijo) ? 1 : 0,
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.neblina,
          // Por capas desde el buscador, a lo largo de las píldoras y apenas debajo de ellas
          { height: fijo + ALTO_PILDORA + HASTA_PILDORAS + COLA_NEBLINA },
          estiloNeblina,
        ]}
      >
        <Neblina
          style={StyleSheet.absoluteFill}
          corte={
            (fijo + ALTO_PILDORA) /
            (fijo + ALTO_PILDORA + HASTA_PILDORAS + COLA_NEBLINA)
          }
        />
      </Animated.View>
      {/* Sin fijar no recibe toques: así no tapa el logo ni la campana */}
      <View
        pointerEvents={fijado ? "box-none" : "none"}
        style={[styles.capa, { top: fijo }]}
      >
        <Animated.View style={[styles.centro, estiloBuscador]}>
          <PildoraBuscador onPress={onPress} />
        </Animated.View>
        {conPildoras ? (
          <Animated.View entering={ENTRADA_PILDORAS} exiting={SALIDA}>
            <FilaPildoras>
              {CATEGORIES.map((category) => (
                <PildoraOpcion
                  key={category.id}
                  valor={category.id}
                  etiqueta={category.label}
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
  // Del borde de arriba de la pantalla hasta un poco más abajo de las píldoras
  neblina: { position: "absolute", top: 0, left: 0, right: 0 },
  // Mismo ancho que la lista del inicio (máximo 760, con 16 de margen a cada lado)
  centro: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  texto: { flex: 1, minWidth: 0, alignSelf: "stretch" },
});
