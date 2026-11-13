import { useEffect, useState } from "react";
import { StyleSheet, View, type TextStyle } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useReducedMotion,
} from "react-native-reanimated";

import { FRASE_BUSQUEDA_FIJA, FRASES_BUSQUEDA } from "../frasesBusqueda";

/** Duración de cada cambio y pausa con la frase quieta */
const TRANSICION_MS = 300;
const PAUSA_MS = 2300;
const EASE = Easing.out(Easing.cubic);

/**
 * Placeholder que alterna frases sobre un `TextInput` (el `placeholder` nativo no se puede
 * animar). Va encima del input sin recibir toques y es decorativo para el lector de
 * pantalla: la etiqueta del input ya dice qué se puede buscar.
 * Con `activo` en false (input con foco o con texto) no se muestra ni rota.
 */
export function PlaceholderRotativo({
  activo,
  style,
}: {
  activo: boolean;
  style: TextStyle;
}) {
  const reduceMotion = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const rota = activo && !reduceMotion;

  useEffect(() => {
    if (!rota) return;
    const intervalo = setInterval(
      () => setIndice((i) => (i + 1) % FRASES_BUSQUEDA.length),
      PAUSA_MS + TRANSICION_MS,
    );
    return () => clearInterval(intervalo);
  }, [rota]);

  if (!activo) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.capa}
    >
      {reduceMotion ? (
        <Animated.Text numberOfLines={1} style={style}>
          {FRASE_BUSQUEDA_FIJA}
        </Animated.Text>
      ) : (
        <Animated.Text
          key={indice}
          numberOfLines={1}
          // Entra desde abajo y sale hacia arriba
          entering={FadeInDown.duration(TRANSICION_MS).easing(EASE).withInitialValues({
            opacity: 0,
            transform: [{ translateY: 10 }],
          })}
          exiting={FadeOutUp.duration(TRANSICION_MS).easing(EASE)}
          style={[style, styles.frase]}
        >
          {FRASES_BUSQUEDA[indice]}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    overflow: "hidden",
  },
  // Las dos frases (la que entra y la que sale) se superponen en el mismo lugar
  frase: { position: "absolute", left: 0, right: 0 },
});
