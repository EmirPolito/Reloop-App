import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import { EASE_OUT_CUBIC } from "@/constants/motion";
import { Text } from "@/features/shared/Text";
import {
  notificationIcon,
  notificationMessage,
  notificationTitle,
} from "../notificationRules";
import type { AppNotification } from "../types";
import { NotificationLeading } from "./NotificationLeading";

/** Tiempo a la vista antes de recogerse sola */
const VISIBLE_MS = 4500;
const ANCHO_RECOGIDA = 116;
const ALTO_RECOGIDA = 34;

const ANCHO_MAXIMO = 370; // Ancho máximo (tablets o pantallas grandes)
const ALTO_ABIERTA = 70; // Alto de la card en mobile
const MARGEN = 16; // Margen lateral: más margen = card menos ancha
const BAJAR_CAPA = 16; // Distancia extra bajo la zona segura (sube/baja la card)

const ASOMAR = { duration: 180, easing: EASE_OUT_CUBIC };
const EXPANDIR = { duration: 300, easing: EASE_OUT_CUBIC };
const RECOGER = { duration: 220, easing: EASE_OUT_CUBIC };
const TEXTO_ENTRA = { duration: 180, easing: EASE_OUT_CUBIC };
const TEXTO_SALE = { duration: 110, easing: EASE_OUT_CUBIC };
// Con "Reducir movimiento" solo queda un fundido, que sí debe animarse
const FUNDIDO = {
  duration: 160,
  easing: EASE_OUT_CUBIC,
  reduceMotion: ReduceMotion.Never,
};

/** Final de la cuenta atrás: un paso mínimo que no depende de "Reducir movimiento" */
const RELOJ = { duration: 1, reduceMotion: ReduceMotion.Never };

/** Arrastre (px) o velocidad (px/s) que cuentan como deslizar hacia abajo o hacia arriba */
const BAJAR = { distancia: 26, velocidad: 600 };
const SUBIR = { distancia: 16, velocidad: 500 };

/**
 * Banner flotante de una notificación recién llegada. Asoma como una píldora pequeña desde
 * el borde superior, se expande a todo el ancho y después aparece el contenido.
 * - Tocarla o deslizarla hacia abajo la abre (`onOpen`).
 * - Si pasa el tiempo o se desliza hacia arriba, el contenido se desvanece, la píldora se
 *   contrae y se recoge en el borde, y la notificación queda sin leer.
 * En ambos casos avisa con `onDismiss` cuando ya no está a la vista. Animaciones y gestos
 * corren en el hilo de UI.
 */
export function NotificationBanner({
  notification,
  onOpen,
  onDismiss,
}: {
  notification: AppNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: anchoVentana } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const anchoAbierta = Math.min(anchoVentana - MARGEN * 2, ANCHO_MAXIMO);

  const titulo = notificationTitle(notification);
  const descripcion = `${notification.actorName} ${notificationMessage(notification)}`;
  const icono = notificationIcon(notification);

  /** Opacidad de toda la píldora */
  const opacidad = useSharedValue(0);
  /** 0 = fuera, sobre el borde superior; 1 = en su sitio */
  const asomada = useSharedValue(reduceMotion ? 1 : 0);
  /** 0 = píldora recogida; 1 = abierta a todo el ancho */
  const abierta = useSharedValue(reduceMotion ? 1 : 0);
  /** Opacidad del contenido */
  const contenido = useSharedValue(reduceMotion ? 1 : 0);
  /** Desplazamiento que sigue al dedo */
  const arrastre = useSharedValue(0);

  /** 1 mientras se va: evita cerrar dos veces (por tiempo y por gesto a la vez) */
  const cerrando = useSharedValue(false);
  /** Cuenta atrás para recogerse sola; vive en el hilo de UI, sin temporizadores de JS */
  const reloj = useSharedValue(0);

  /** Sin reacción: se desvanece el contenido, se contrae y se recoge arriba */
  const recoger = () => {
    "worklet";
    if (cerrando.get()) return;
    cerrando.set(true);
    cancelAnimation(reloj);
    if (reduceMotion) {
      opacidad.set(
        withTiming(0, FUNDIDO, (terminada) => {
          if (terminada) scheduleOnRN(onDismiss);
        }),
      );
      return;
    }
    const subir = TEXTO_SALE.duration + RECOGER.duration - 60;
    contenido.set(withTiming(0, TEXTO_SALE));
    abierta.set(withDelay(TEXTO_SALE.duration - 30, withTiming(0, RECOGER)));
    opacidad.set(withDelay(subir, withTiming(0, ASOMAR)));
    asomada.set(
      withDelay(
        subir,
        withTiming(0, ASOMAR, (terminada) => {
          if (terminada) scheduleOnRN(onDismiss);
        }),
      ),
    );
  };

  /** Con reacción: se abre el destino y el banner se va con un fundido corto */
  const abrir = () => {
    "worklet";
    if (cerrando.get()) return;
    cerrando.set(true);
    cancelAnimation(reloj);
    scheduleOnRN(onOpen);
    opacidad.set(
      withTiming(0, FUNDIDO, (terminada) => {
        if (terminada) scheduleOnRN(onDismiss);
      }),
    );
  };

  /** (Re)inicia la cuenta atrás; tocar el banner la detiene y soltarlo la reinicia */
  const programar = () => {
    "worklet";
    if (cerrando.get()) return;
    reloj.set(0);
    reloj.set(
      withDelay(
        VISIBLE_MS,
        withTiming(1, RELOJ, (terminada) => {
          if (terminada) recoger();
        }),
        ReduceMotion.Never,
      ),
    );
  };

  // Entrada: asoma, se expande y aparece el contenido
  useEffect(() => {
    if (reduceMotion) {
      opacidad.set(withTiming(1, FUNDIDO));
    } else {
      opacidad.set(withTiming(1, ASOMAR));
      asomada.set(withTiming(1, ASOMAR));
      abierta.set(withDelay(110, withTiming(1, EXPANDIR)));
      contenido.set(withDelay(300, withTiming(1, TEXTO_ENTRA)));
    }
    scheduleOnUI(programar);
    // Solo al montar: cada notificación monta su propio banner (ver `key` en el host)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deslizar = Gesture.Pan()
    .minDistance(6)
    .onBegin(() => {
      cancelAnimation(reloj);
    })
    .onUpdate((e) => {
      // Hacia abajo ofrece resistencia; hacia arriba sigue al dedo
      arrastre.set(e.translationY > 0 ? e.translationY * 0.35 : e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > BAJAR.distancia || e.velocityY > BAJAR.velocidad) {
        arrastre.set(withTiming(0, RECOGER));
        abrir();
      } else if (
        e.translationY < -SUBIR.distancia ||
        e.velocityY < -SUBIR.velocidad
      ) {
        recoger();
      } else {
        arrastre.set(withTiming(0, RECOGER));
      }
    })
    .onFinalize(() => {
      programar();
    });

  const tocar = Gesture.Tap().onEnd((_e, completado) => {
    if (completado) abrir();
  });

  const gestos = Gesture.Exclusive(deslizar, tocar);

  const estiloPildora = useAnimatedStyle(() => {
    const a = abierta.get();
    return {
      width: interpolate(a, [0, 1], [ANCHO_RECOGIDA, anchoAbierta]),
      height: interpolate(a, [0, 1], [ALTO_RECOGIDA, ALTO_ABIERTA]),
      opacity: opacidad.get(),
      transform: [
        {
          translateY:
            (asomada.get() - 1) * (ALTO_RECOGIDA + insets.top + BAJAR_CAPA) +
            arrastre.get(),
        },
      ],
    };
  });

  const estiloContenido = useAnimatedStyle(() => ({
    opacity: contenido.get(),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.capa, { top: insets.top + BAJAR_CAPA }]}
    >
      <GestureDetector gesture={gestos}>
        <Animated.View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${titulo}. ${descripcion}`}
          accessibilityHint="Toca para abrir"
          style={[styles.pildora, estiloPildora]}
        >
          {/* Ancho fijo: el texto no se reacomoda mientras la píldora cambia de tamaño */}
          <Animated.View
            style={[styles.contenido, { width: anchoAbierta }, estiloContenido]}
          >
            <NotificationLeading notification={notification} size={47} />
            <View style={styles.textos}>
              <Text numberOfLines={1} style={styles.titulo}>
                {titulo}
              </Text>
              <Text numberOfLines={1} style={styles.mensaje}>
                {descripcion}
              </Text>
            </View>
            <Ionicons name={icono} size={20} color="#111113" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  pildora: {
    borderRadius: ALTO_ABIERTA / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
  },
  contenido: {
    height: ALTO_ABIERTA,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 10,
    paddingRight: 23,
  },
  textos: { flex: 1, minWidth: 0 },
  titulo: {
    top: -0.5,
    color: "#111113",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  mensaje: {
    color: "#71717A",
    fontFamily: "Inter_500Medium",
    fontSize: 13.5,
    marginTop: 1.5,
  },
});
