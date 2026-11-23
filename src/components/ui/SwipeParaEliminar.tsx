import { useDissolve } from "dissolve-ui";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";

/** Curva calmada, sin rebote (la de dissolve-ui) */
const CALM = Easing.bezier(0.32, 0.72, 0, 1);
/** Fracción del ancho que hay que arrastrar para que, al soltar, se elimine */
const UMBRAL = 0.4;
/** Velocidad (px/s) de un tirón rápido que también elimina */
const TIRON = 900;
/** Lo que hay que deslizar (px) para que el rojo esté del todo visible */
const APARICION_ROJO = 8;
/** Lo que hay que deslizar (px) para que los textos grises estén del todo claros */
const APARICION_TEXTO = 40;

/** Cuánto rojo se ve detrás de la fila (0 en reposo, 1 deslizada): los textos grises lo siguen */
const ProgresoContext = createContext<SharedValue<number> | null>(null);

const TextoAnimado = Animated.createAnimatedComponent(Text);

/**
 * Texto gris de una fila que se puede deslizar: al salir el rojo se aclara un poco (sin llegar
 * al blanco fuerte) para que se siga leyendo sobre él. Fuera de una fila deslizable es un texto normal.
 */
export function TextoSobreRojo({
  colorBase,
  colorSobreRojo = "rgba(255,255,255,0.82)",
  style,
  ...props
}: ComponentProps<typeof Text> & {
  colorBase: string;
  colorSobreRojo?: string;
}) {
  const progreso = useContext(ProgresoContext);
  const estilo = useAnimatedStyle(() => ({
    color: progreso
      ? interpolateColor(progreso.get(), [0, 1], [colorBase, colorSobreRojo])
      : colorBase,
  }));
  return <TextoAnimado {...props} style={[style, estilo]} />;
}

/**
 * Fila que se desliza a la izquierda para eliminarla (como Mail o WhatsApp), con el efecto de
 * polvo de dissolve-ui: pasado el 40 % del ancho (o con un tirón rápido) la fila se disuelve,
 * la lista se cierra y entonces corre `onDelete`. Si `onDelete` falla, la fila vuelve. Es una
 * versión de `SwipeToDelete` de dissolve-ui con estilos propios (el original necesita NativeWind v5).
 *
 * La fila no se recorta ni cambia de capas mientras se arrastra: solo se mueve (transform), así
 * el gesto va fluido y sin parpadeos, y la sombra de la fila no se corta.
 */
export function SwipeParaEliminar({
  children,
  onDelete,
  disabled = false,
  radio = 0,
  separacion = 0,
  colorAccion = "#EF4444",
}: {
  children: ReactNode;
  /** Corre cuando la fila ya se disolvió y se cerró: aquí se elimina el dato. Si falla, la fila vuelve. */
  onDelete: () => Promise<void> | void;
  disabled?: boolean;
  /** Radio de las esquinas de la fila (el fondo rojo lo sigue) */
  radio?: number;
  /** Espacio que queda debajo de la fila (entre filas): se cierra con ella, pero no se pinta de rojo */
  separacion?: number;
  colorAccion?: string;
}) {
  const { ref, dissolving, dissolve, reset } = useDissolve();
  const tx = useSharedValue(0);
  const ancho = useSharedValue(1);
  // Alto de la envoltura: -1 = el natural; al eliminar baja hasta 0
  const alto = useSharedValue(-1);
  const medido = useSharedValue(0);
  const progresoTexto = useDerivedValue(() =>
    interpolate(-tx.get(), [0, APARICION_TEXTO], [0, 1], Extrapolation.CLAMP),
  );

  /** Si no se pudo eliminar, la fila vuelve a su lugar */
  const volver = () => {
    alto.set(-1);
    tx.set(0);
    reset();
  };

  const eliminar = async () => {
    try {
      await onDelete();
    } catch {
      volver();
    }
  };

  const confirmar = async () => {
    try {
      await dissolve({ preset: "dust" });
    } catch {
      // El efecto es solo visual (la web no puede capturar la fila): la fila igual se elimina
    }
    alto.set(medido.get());
    alto.set(
      withTiming(0, { duration: 280, easing: CALM }, (terminado) => {
        if (terminado) scheduleOnRN(eliminar);
      }),
    );
  };

  const arrastre = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onChange((e) => {
      const siguiente = tx.get() + e.changeX;
      // Libre hacia la izquierda; hacia la derecha, una banda elástica
      tx.set(siguiente > 0 ? siguiente * 0.25 : siguiente);
    })
    .onEnd((e) => {
      if (-tx.get() > ancho.get() * UMBRAL || e.velocityX < -TIRON) {
        tx.set(
          withTiming(
            -ancho.get() * 0.45,
            { duration: 160, easing: CALM },
            (terminado) => {
              if (terminado) scheduleOnRN(confirmar);
            },
          ),
        );
      } else {
        tx.set(withTiming(0, { duration: 300, easing: CALM }));
      }
    });

  const estiloFila = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }],
  }));
  // El rojo asoma en cuanto la fila se mueve (en reposo no se ve: en filas sin fondo se vería detrás)
  const estiloAccion = useAnimatedStyle(() => ({
    opacity: interpolate(
      -tx.get(),
      [0, APARICION_ROJO],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));
  const estiloIcono = useAnimatedStyle(() => {
    const p = Math.min(1, -tx.get() / (ancho.get() * UMBRAL));
    return {
      opacity: interpolate(p, [0, 0.4, 1], [0, 0.6, 1]),
      transform: [{ scale: interpolate(p, [0, 1], [0.6, 1.08]) }],
    };
  });
  const estiloEnvoltura = useAnimatedStyle(() =>
    alto.get() < 0 ? {} : { height: alto.get(), overflow: "hidden" },
  );

  const alMedir = (e: LayoutChangeEvent) => {
    ancho.set(e.nativeEvent.layout.width);
    if (alto.get() < 0) medido.set(e.nativeEvent.layout.height + separacion);
  };

  return (
    <ProgresoContext.Provider value={progresoTexto}>
      <Animated.View style={[{ paddingBottom: separacion }, estiloEnvoltura]}>
        <GestureDetector gesture={arrastre}>
          {/* Vista normal: guarda el ref de la captura */}
          <View
            // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
            ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
            collapsable={false}
            onLayout={alMedir}
            style={{ opacity: dissolving ? 0 : 1 }}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.accion,
                {
                  backgroundColor: colorAccion,
                  // Un poco más redondeado que la fila: así no asoma por sus esquinas
                  borderRadius: radio > 0 ? radio + 2 : 0,
                },
                estiloAccion,
              ]}
            >
              <Animated.View style={estiloIcono}>
                <IconoEliminarLinea size={26} color="#FFFFFF" />
              </Animated.View>
            </Animated.View>
            <Animated.View style={estiloFila}>{children}</Animated.View>
          </View>
        </GestureDetector>
      </Animated.View>
    </ProgresoContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Acción detrás de la fila: la papelera, a la derecha
  accion: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 26,
  },
});
