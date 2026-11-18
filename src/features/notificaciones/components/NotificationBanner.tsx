import { Ionicons } from "@expo/vector-icons";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
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
/** Recogida, la notificación es un círculo blanco con su icono dentro */
const ANCHO_RECOGIDA = 56;
const ALTO_RECOGIDA = 56;
const LADO_LEADING = 47;
const PADDING_LEADING = 10;
/** El icono recogido se ve un poco más chico que abierto */
const ESCALA_LEADING_RECOGIDO = 0.82;

const ANCHO_MAXIMO = 370; // Ancho máximo (tablets o pantallas grandes)
const ALTO_ABIERTA = 65; // Alto de la card en mobile
const MARGEN = 16; // Margen lateral: más margen = card menos ancha
const BAJAR_CAPA = 16; // Distancia extra bajo la zona segura (sube/baja la card)

const ASOMAR = { duration: 320, easing: EASE_OUT_CUBIC };
// Entrada con la misma curva suave que la salida
const ENTRA = { duration: 520, easing: Easing.bezier(0.32, 0.72, 0, 1) };
const EXPANDIR = { duration: 620, easing: Easing.bezier(0.32, 0.72, 0, 1) };
// Salida suave: arranca con calma y se asienta sin cortes
const SUAVE = Easing.bezier(0.32, 0.72, 0, 1);
const RECOGER = { duration: 620, easing: SUAVE };
const SALIDA_SUBE = { duration: 400, easing: SUAVE };
const TEXTO_ENTRA = { duration: 360, easing: SUAVE };
const TEXTO_SALE = { duration: 240, easing: SUAVE };
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
/** Lo que muestra el banner cuando no es una notificación (un aviso de la app) */
export interface ContenidoBanner {
  titulo: string;
  descripcion: string;
  /** Lo que va a la izquierda (un círculo de 47 px) */
  leading: ReactNode;
  icono: ComponentProps<typeof Ionicons>["name"] | null;
  /** Lo que anuncia el lector de pantalla sobre tocarlo */
  pista?: string;
}

type PropsBanner = {
  onOpen: () => void;
  onDismiss: () => void;
} & (
  | { notification: AppNotification }
  | { contenido: ContenidoBanner }
);

/** El banner de una notificación, o con `contenido` el de un aviso de la app (mismo diseño). */
export function NotificationBanner(props: PropsBanner) {
  const { onOpen, onDismiss } = props;
  const insets = useSafeAreaInsets();
  const { width: anchoVentana } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const anchoAbierta = Math.min(anchoVentana - MARGEN * 2, ANCHO_MAXIMO);

  const { titulo, descripcion, leading, icono, pista } =
    "notification" in props
      ? {
          titulo: notificationTitle(props.notification),
          descripcion: `${props.notification.actorName} ${notificationMessage(props.notification)}`,
          leading: (
            <NotificationLeading notification={props.notification} size={47} />
          ),
          // Con círculo de color a la izquierda no se repite un icono a la derecha
          icono:
            props.notification.type === "seguidor"
              ? notificationIcon(props.notification)
              : null,
          pista: "Toca para abrir",
        }
      : props.contenido;

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
    opacidad.set(withDelay(subir, withTiming(0, SALIDA_SUBE)));
    asomada.set(
      withDelay(
        subir,
        withTiming(0, SALIDA_SUBE, (terminada) => {
          if (terminada) scheduleOnRN(onDismiss);
        }),
      ),
    );
  };

  /** Con reacción: se abre el destino y el banner se recoge con la misma salida suave */
  const abrir = () => {
    "worklet";
    if (cerrando.get()) return;
    scheduleOnRN(onOpen);
    recoger();
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
      asomada.set(withTiming(1, ENTRA));
      abierta.set(withDelay(280, withTiming(1, EXPANDIR)));
      contenido.set(withDelay(620, withTiming(1, TEXTO_ENTRA)));
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
      borderRadius: interpolate(a, [0, 1], [ALTO_RECOGIDA / 2, ALTO_ABIERTA / 2]),
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

  // La sombra tiene ya su tamaño final y solo cambia su opacidad (barato): animar el tamaño
  // de una vista con sombra obligaba a redibujarla en cada cuadro
  const estiloSombra = useAnimatedStyle(() => ({
    opacity: opacidad.get() * interpolate(abierta.get(), [0.85, 1], [0, 1], "clamp"),
    transform: [{ translateY: (asomada.get() - 1) * (ALTO_RECOGIDA + insets.top + BAJAR_CAPA) + arrastre.get() }],
  }));

  // El círculo (avatar o icono) pasa del centro de la bolita recogida a la izquierda de la
  // tarjeta, creciendo hasta su tamaño
  const estiloLeading = useAnimatedStyle(() => {
    const a = abierta.get();
    return {
      left: interpolate(
        a,
        [0, 1],
        [(ANCHO_RECOGIDA - LADO_LEADING) / 2, PADDING_LEADING],
      ),
      transform: [{ scale: interpolate(a, [0, 1], [ESCALA_LEADING_RECOGIDO, 1]) }],
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
      <Animated.View
        pointerEvents="none"
        style={[styles.sombra, { width: anchoAbierta }, estiloSombra]}
      />
      <GestureDetector gesture={gestos}>
        <Animated.View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${titulo}. ${descripcion}`}
          accessibilityHint={pista ?? "Toca para cerrar"}
          style={[styles.pildora, estiloPildora]}
        >
          {/* Ancho fijo: el texto no se reacomoda mientras la píldora cambia de tamaño */}
          <Animated.View style={[styles.leading, estiloLeading]}>
            {leading}
          </Animated.View>
          <Animated.View
            style={[styles.contenido, { width: anchoAbierta }, estiloContenido]}
          >
            <View style={styles.textos}>
              <Text numberOfLines={1} style={styles.titulo}>
                {titulo}
              </Text>
              <Text numberOfLines={1} style={styles.mensaje}>
                {descripcion}
              </Text>
            </View>
            {icono ? <Ionicons name={icono} size={20} color="#111113" /> : null}
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
  },
  leading: {
    position: "absolute",
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  sombra: {
    position: "absolute",
    top: 0,
    height: ALTO_ABIERTA,
    borderRadius: ALTO_ABIERTA / 2,
    backgroundColor: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
  },
  contenido: {
    position: "absolute",
    top: 0,
    left: 0,
    height: ALTO_ABIERTA,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // Deja libre el círculo de la izquierda
    paddingLeft: PADDING_LEADING + LADO_LEADING + 10,
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
