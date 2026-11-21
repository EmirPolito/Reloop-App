import { useCallback, useState, type PropsWithChildren } from "react";
import {
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";

/** Espacio bajo las píldoras de filtro (el padding de abajo de `FiltrosPildoras`) */
const BAJO_PILDORAS = 16;
/** Scroll en el que la neblina termina de aparecer */
const TRAMO_NEBLINA = 24;

/**
 * Scroll de la lista que pasa por detrás de la cabecera, para mostrar la neblina. Sirve con
 * cualquier lista (`onScroll` normal, con `scrollEventThrottle={16}`); `reiniciar` vuelve a
 * cero cuando la lista se monta de nuevo (al cambiar de filtro).
 */
export function useScrollCabecera() {
  const desplazado = useSharedValue(0);
  const alHacerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      desplazado.set(event.nativeEvent.contentOffset.y),
    [desplazado],
  );
  const reiniciar = useCallback(() => desplazado.set(0), [desplazado]);
  return { desplazado, alHacerScroll, reiniciar };
}

/**
 * Encabezado sin tarjeta de fondo (favoritos, chats y notificaciones): flota sobre la lista,
 * que pasa por detrás. En reposo no hay neblina; al hacer scroll aparece una del color del
 * fondo que cubre hasta debajo de las píldoras, para que lo de detrás no choque con el título y los
 * botones. Informa su alto con `onAlto` para que la lista empiece debajo de él.
 */
export function CabeceraFlotante({
  paddingTop,
  desplazado,
  onAlto,
  children,
}: PropsWithChildren<{
  paddingTop: number;
  desplazado: SharedValue<number>;
  onAlto: (alto: number) => void;
}>) {
  const [alto, setAlto] = useState(0);
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(desplazado.get() / TRAMO_NEBLINA, 0), 1),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={styles.capa}
      onLayout={(e) => {
        setAlto(e.nativeEvent.layout.height);
        onAlto(e.nativeEvent.layout.height);
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.neblina, estiloNeblina]}
      >
        <Neblina
          style={StyleSheet.absoluteFill}
          corte={
            // El buscador termina 8 + 40 (píldoras) + el espacio de abajo antes del final
            alto > 0
              ? (alto - BAJO_PILDORAS - 48) /
                (alto - BAJO_PILDORAS + COLA_NEBLINA)
              : undefined
          }
        />
      </Animated.View>
      <View pointerEvents="box-none" style={{ paddingTop }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: "absolute", top: 0, left: 0, right: 0 },
  // Por capas desde el buscador, a lo largo de las píldoras y apenas debajo de ellas
  neblina: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: BAJO_PILDORAS - COLA_NEBLINA,
  },
});
