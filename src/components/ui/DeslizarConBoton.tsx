import { useDissolve } from "dissolve-ui";
import * as Haptics from "expo-haptics";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";

/** Curva calmada, sin rebote (la de dissolve-ui) */
const CALM = Easing.bezier(0.32, 0.72, 0, 1);
/** Duración del efecto de polvo al eliminar (ms) */
const DURACION_POLVO = 650;
/** Ancho del botón Eliminar cuando la fila queda abierta */
const ANCHO_BOTON = 96;
/** Con deslizar esto (px) hacia la izquierda ya se queda abierta: no se regresa */
const ABRE_CON = 24;
/** Velocidad (px/s) a partir de la cual el gesto cuenta como intención (abrir o cerrar) */
const INTENCION = 150;
/** Más allá del botón la fila se sigue arrastrando libre, hasta el borde izquierdo */
const RESISTENCIA = 1;
/**
 * Fracción del ancho a partir de la cual la fila se desliza sola hasta el borde (todavía con el
 * dedo encima) y, al soltar, se elimina sin tocar el botón
 */
const UMBRAL_ELIMINAR = 0.55;
/** Un desliz rápido (px/s) elimina sin tocar el botón */
const RAPIDO_ELIMINA = 800;
/** Con el dedo casi quieto (px/s), los movimientos menores a ZONA_MUERTA (px) se ignoran */
const DEDO_QUIETO = 60;
const ZONA_MUERTA = 5;
/** Lo que tarda la fila en deslizarse sola hasta el borde al pasar el umbral */
const DESLIZ_ARMADO = { duration: 150, easing: CALM };
/**
 * Lo mínimo que hay que haber deslizado la fila (fracción del ancho) para que un desliz rápido
 * elimine: antes bastaban 40 px y un desliz corto pero rápido ya eliminaba el chat
 */
const MINIMO_RAPIDO = 0.4;
/**
 * Resorte al soltar: hereda la velocidad del dedo, así la fila resbala y se acomoda suave en
 * lugar de frenar en seco. Sin pasarse del destino (no rebota).
 */
const RESORTE = {
  damping: 26,
  stiffness: 260,
  mass: 0.9,
  overshootClamping: true,
} as const;

/** La fila abierta en este momento: al abrir otra, la anterior se cierra */
const filaAbierta: { cerrar: (() => void) | null } = { cerrar: null };

/** Registra la fila que se abrió y cierra la que estaba abierta */
function registrarAbierta(cerrar: () => void) {
  if (filaAbierta.cerrar && filaAbierta.cerrar !== cerrar) filaAbierta.cerrar();
  filaAbierta.cerrar = cerrar;
}

/** Olvida la fila si era la abierta */
function soltarAbierta(cerrar: () => void) {
  if (filaAbierta.cerrar === cerrar) filaAbierta.cerrar = null;
}

/**
 * Fila que se desliza a la izquierda y deja ver el botón Eliminar a su derecha (como Mail): el
 * rojo va pegado al borde de la fila y la empuja, no se pinta detrás de ella. Con un desliz
 * corto queda abierta mostrando el botón (no se regresa). Se elimina de dos formas: tocando el
 * botón, o con un desliz rápido; o jalando más de la mitad del ancho, cuando la fila se
 * desliza sola hasta el borde (con una vibración ligera) y al soltar se elimina. Con el dedo
 * casi quieto encima, el pulso no la mueve. Al soltar,
 * un resorte hereda la velocidad del dedo para que resbale en lugar de frenar en seco. En las dos
 * la fila se vuelve polvo (dissolve-ui), la lista se cierra y entonces corre `onDelete`. Si
 * falla, la fila vuelve. Tocar la fila abierta la cierra.
 */
export function DeslizarConBoton({
  children,
  onDelete,
  disabled = false,
  colorAccion = "#EF4444",
  radioArriba = 0,
  radioAbajo = 0,
}: {
  children: ReactNode;
  /** Corre cuando la fila ya se disolvió y se cerró: aquí se elimina el dato. Si falla, la fila vuelve. */
  onDelete: () => Promise<void> | void;
  disabled?: boolean;
  colorAccion?: string;
  /** Esquinas de arriba (primera fila de una tarjeta): el rojo no las cuadra */
  radioArriba?: number;
  /** Esquinas de abajo (última fila de una tarjeta) */
  radioAbajo?: number;
}) {
  const { ref, dissolving, dissolve, reset } = useDissolve();
  const tx = useSharedValue(0);
  const ancho = useSharedValue(1);
  // Alto de la envoltura: -1 = el natural; al eliminar baja hasta 0
  const alto = useSharedValue(-1);
  const medido = useSharedValue(0);
  // Dónde estaba la fila al empezar a arrastrar
  const inicio = useSharedValue(0);
  // Si ya pasó el umbral: la fila está (o va) en el borde, y al soltar se elimina
  const armada = useSharedValue(false);
  const [abierta, setAbierta] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const cerrar = useCallback(() => {
    tx.set(withSpring(0, RESORTE));
    setAbierta(false);
  }, [tx]);

  const alAbrir = () => {
    registrarAbierta(cerrar);
    setAbierta(true);
  };
  const alCerrar = () => {
    soltarAbierta(cerrar);
    setAbierta(false);
  };

  // En modo de selección la fila no se queda abierta: se cierra y, al terminar, se avisa
  useEffect(() => {
    if (!disabled) return;
    tx.set(
      withTiming(0, { duration: 260, easing: CALM }, (terminado) => {
        if (terminado) scheduleOnRN(setAbierta, false);
      }),
    );
  }, [disabled, tx]);
  // Al desmontar deja de ser la abierta
  useEffect(() => () => soltarAbierta(cerrar), [cerrar]);

  /** Vibración ligera al pasar el umbral: avisa que al soltar se elimina */
  const vibrar = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const eliminar = async () => {
    try {
      await onDelete();
    } catch {
      alto.set(-1);
      tx.set(0);
      reset();
      setEliminando(false);
      alCerrar();
    }
  };

  const confirmar = async () => {
    if (eliminando) return;
    setEliminando(true);
    try {
      // Más corto que el de serie: el polvo arranca y termina rápido
      await dissolve({ preset: "dust", duration: DURACION_POLVO });
    } catch {
      // El efecto es solo visual (la web no puede capturar la fila): la fila igual se elimina
    }
    alto.set(medido.get());
    alto.set(
      withTiming(0, { duration: 220, easing: CALM }, (terminado) => {
        if (terminado) scheduleOnRN(eliminar);
      }),
    );
  };

  const arrastre = Gesture.Pan()
    .enabled(!disabled && !eliminando)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    // Al activarse se descuenta lo que el dedo ya recorrió antes de que el gesto arrancara:
    // así la fila no brinca esos píxeles de golpe y sigue al dedo desde donde está
    .onStart((e) => {
      inicio.set(tx.get() - e.translationX);
      armada.set(false);
    })
    // Se calcula desde donde empezó el dedo (no sumando cuadro a cuadro): sin acumular errores
    .onUpdate((e) => {
      const crudo = inicio.get() + e.translationX;
      let destino: number;
      if (crudo > 0) {
        // Hacia la derecha no hay nada: banda elástica corta
        destino = crudo * 0.2;
      } else if (crudo < -ANCHO_BOTON) {
        // Pasado el botón el rojo sigue creciendo hasta el borde de la fila
        const extra = (-crudo - ANCHO_BOTON) * RESISTENCIA;
        destino = -Math.min(ANCHO_BOTON + extra, ancho.get());
      } else {
        destino = crudo;
      }

      // Pasó el umbral: se nota que la quieres eliminar y se desliza sola hasta el borde
      const pasa = -crudo > ancho.get() * UMBRAL_ELIMINAR;
      if (pasa !== armada.get()) {
        armada.set(pasa);
        if (pasa) {
          tx.set(withTiming(-ancho.get(), DESLIZ_ARMADO));
          scheduleOnRN(vibrar);
          return;
        }
      }
      // Armada, se queda en el borde aunque el dedo se mueva un poco
      if (armada.get()) return;

      // Dedo casi quieto: el pulso no mueve la fila (si no, temblaba al sostenerla)
      if (
        Math.abs(e.velocityX) < DEDO_QUIETO &&
        Math.abs(destino - tx.get()) < ZONA_MUERTA
      ) {
        return;
      }
      tx.set(destino);
    })
    .onEnd((e) => {
      const jalado = -tx.get();
      const v = e.velocityX;
      // Venía abierta y el dedo fue hacia la derecha: es para cerrarla
      const veniaAbierta = inicio.get() <= -ANCHO_BOTON / 2;

      // Ya deslizada hasta el borde (armada), o un desliz rápido a la izquierda: se elimina
      if (
        armada.get() ||
        (v < -RAPIDO_ELIMINA && jalado > ancho.get() * MINIMO_RAPIDO)
      ) {
        tx.set(
          // Un tramo corto y fijo hasta el borde (un resorte tardaba en asentarse y el polvo
          // esperaba de más)
          withTiming(
            -ancho.get(),
            { duration: 150, easing: CALM },
            (terminado) => {
              if (terminado) scheduleOnRN(confirmar);
            },
          ),
        );
        return;
      }

      const cerrarla = veniaAbierta
        ? v > INTENCION || jalado < ANCHO_BOTON * 0.6
        : v > INTENCION || jalado < ABRE_CON;
      tx.set(
        withSpring(cerrarla ? 0 : -ANCHO_BOTON, { ...RESORTE, velocity: v }),
      );
      scheduleOnRN(cerrarla ? alCerrar : alAbrir);
    });

  const estiloFila = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }],
  }));
  // El rojo mide lo que se deslizó la fila: siempre pegado a su borde derecho
  const estiloAccion = useAnimatedStyle(() => ({
    width: Math.max(0, -tx.get()),
  }));
  const estiloEnvoltura = useAnimatedStyle(() =>
    alto.get() < 0 ? {} : { height: alto.get(), overflow: "hidden" },
  );

  const alMedir = (e: LayoutChangeEvent) => {
    ancho.set(e.nativeEvent.layout.width);
    if (alto.get() < 0) medido.set(e.nativeEvent.layout.height);
  };

  return (
    <Animated.View style={estiloEnvoltura}>
      <GestureDetector gesture={arrastre}>
        {/* Vista normal: guarda el ref de la captura del polvo */}
        <View
          // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
          ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
          collapsable={false}
          onLayout={alMedir}
          style={[
            styles.contenedor,
            {
              opacity: dissolving ? 0 : 1,
              borderTopLeftRadius: radioArriba,
              borderTopRightRadius: radioArriba,
              borderBottomLeftRadius: radioAbajo,
              borderBottomRightRadius: radioAbajo,
            },
          ]}
        >
          <Animated.View style={estiloFila}>
            {children}
            {/* Abierta, tocar la fila la cierra en lugar de abrirla */}
            {abierta ? (
              <Pressable
                accessibilityLabel="Cerrar opciones"
                onPress={cerrar}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </Animated.View>

          <Animated.View
            style={[
              styles.accion,
              { backgroundColor: colorAccion },
              estiloAccion,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
              disabled={!abierta || eliminando}
              onPress={confirmar}
              style={styles.boton}
            >
              <IconoEliminarLinea size={24} color="#FFFFFF" />
              <Text style={styles.texto}>Eliminar</Text>
            </Pressable>
          </Animated.View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: { overflow: "hidden" },
  // Pegado a la derecha; su ancho sigue al desliz de la fila
  accion: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    overflow: "hidden",
  },
  // El icono y el texto quedan del lado de la fila, como en Mail, aunque el rojo crezca
  boton: {
    width: ANCHO_BOTON,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  texto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
});
