import { useDissolve } from "dissolve-ui";
import {
  createContext,
  useCallback,
  useContext,
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
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";

/** Curva calmada, sin rebote (la de dissolve-ui) */
const CALM = Easing.bezier(0.32, 0.72, 0, 1);
/** Duración del efecto de polvo al eliminar (ms) */
const DURACION_POLVO = 650;
/**
 * Antes del polvo todo se cubre de rojo, contenido incluido: así el polvo se ve en todo (una
 * tarjeta blanca sobre un fondo casi blanco se volvía polvo invisible y solo se veía el rojo)
 */
const CUBRIR = { duration: 200, easing: CALM };
/**
 * Cómo se ve la opción de eliminar:
 * - fila: un rojo pegado al borde derecho de la fila con "Eliminar" (filas de una lista).
 * - tarjeta: una píldora roja con la forma de la tarjeta, dentro de ella, a su derecha.
 * - burbuja: la burbuja se alarga y a su derecha, dentro de ella, aparece un rojo de todo su alto
 *   con la basura, como en las filas (ver
 *   `BotonEliminarBurbuja` y `useAperturaBurbuja`).
 */
export type FormaDeslizar = "fila" | "tarjeta" | "burbuja";
/** Lo que se alarga la burbuja al abrirse: el lugar de su botón */
export const ESPACIO_BOTON_BURBUJA = 58;
/** Lo que se desliza el contenido cuando queda abierto */
const ANCHO_ABIERTA: Record<FormaDeslizar, number> = {
  fila: 96,
  tarjeta: 84,
  burbuja: ESPACIO_BOTON_BURBUJA,
};
/** Espacio entre la tarjeta y su píldora roja */
const SEPARACION_TARJETA = 8;
/** Con deslizar esto (px) hacia la izquierda ya se queda abierta: no se regresa */
const ABRE_CON = 24;
/** Velocidad (px/s) a partir de la cual el gesto cuenta como intención (abrir o cerrar) */
const INTENCION = 150;
/** Más allá de la opción el contenido apenas se mueve: no hay nada más que mostrar */
const RESISTENCIA = 0.15;
/** Con el dedo casi quieto (px/s), los movimientos menores a ZONA_MUERTA (px) se ignoran */
const DEDO_QUIETO = 60;
const ZONA_MUERTA = 5;
/**
 * Resorte al soltar: hereda la velocidad del dedo, así el contenido resbala y se acomoda suave
 * en lugar de frenar en seco. Sin pasarse del destino (no rebota).
 */
const RESORTE = {
  damping: 24,
  stiffness: 170,
  mass: 1,
  overshootClamping: true,
} as const;

interface EstadoEliminar {
  /** Al eliminar: 0 = como está, 1 = todo cubierto de rojo (justo antes del polvo) */
  cubrir: SharedValue<number>;
  /** burbuja: qué tanto está abierta (0 a 1): lo que se alarga y lo que se ve el botón */
  apertura: SharedValue<number>;
  abierta: boolean;
  eliminando: boolean;
  confirmar: () => void;
  cerrar: () => void;
}
const EliminarContext = createContext<EstadoEliminar | null>(null);

/**
 * Capa roja de la burbuja que se elimina: va como ÚLTIMO hijo (la burbuja la recorta), y justo
 * antes del polvo la cubre de rojo. El icono de basura se queda donde estaba su botón: así no se
 * ve todo rojo, sino qué está pasando. Fuera de `DeslizarConBoton` no dibuja nada.
 */
export function TapaRoja({
  style,
  color = "#EF4444",
}: {
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  const cubrir = useContext(EliminarContext)?.cubrir;
  const estilo = useAnimatedStyle(() => ({
    opacity: cubrir ? cubrir.get() : 0,
  }));
  if (!cubrir) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.tapaRoja,
        { backgroundColor: color },
        style,
        estilo,
      ]}
    >
      <View style={[styles.boton, styles.iconoTapa]}>
        <IconoEliminarLinea size={22} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

/**
 * Para la burbuja: qué tanto está abierta (0 a 1). Con esto se alarga su relleno derecho
 * `ESPACIO_BOTON_BURBUJA` px, donde va su botón. Fuera de `DeslizarConBoton`, null.
 */
export function useAperturaBurbuja(): SharedValue<number> | null {
  return useContext(EliminarContext)?.apertura ?? null;
}

/**
 * Botón de eliminar DENTRO de la burbuja (va al final, antes de `TapaRoja`): un rojo de todo su
 * alto pegado a su borde derecho, con la basura en blanco, como en las filas de chats. Crece con
 * lo que la burbuja se alarga. Es un rectángulo: la burbuja debe recortar lo de adentro
 * (`overflow: "hidden"`) para darle sus esquinas. Abierta, tocar el resto de la burbuja la cierra. Fuera de `DeslizarConBoton` no dibuja nada.
 */
export function BotonEliminarBurbuja({
  color = "#EF4444",
}: {
  color?: string;
}) {
  const estado = useContext(EliminarContext);
  const apertura = estado?.apertura;
  const estiloAncho = useAnimatedStyle(() => ({
    width: (apertura ? apertura.get() : 0) * ESPACIO_BOTON_BURBUJA,
  }));
  if (!estado) return null;
  return (
    <>
      {/* Abierta, tocar la burbuja la cierra (debajo del botón: encima le robaba el toque) */}
      {estado.abierta ? (
        <Pressable
          accessibilityLabel="Cerrar opciones"
          onPress={estado.cerrar}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Animated.View
        style={[styles.accion, { backgroundColor: color }, estiloAncho]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar mensaje"
          disabled={!estado.abierta || estado.eliminando}
          onPress={estado.confirmar}
          style={[styles.boton, { width: ESPACIO_BOTON_BURBUJA }]}
        >
          <IconoEliminarLinea size={22} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </>
  );
}

/** Lo abierto en este momento: al abrir otro, el anterior se cierra */
const filaAbierta: { cerrar: (() => void) | null } = { cerrar: null };

/** Registra lo que se abrió y cierra lo que estaba abierto */
function registrarAbierta(cerrar: () => void) {
  if (filaAbierta.cerrar && filaAbierta.cerrar !== cerrar) filaAbierta.cerrar();
  filaAbierta.cerrar = cerrar;
}

/** Lo olvida si era lo abierto */
function soltarAbierta(cerrar: () => void) {
  if (filaAbierta.cerrar === cerrar) filaAbierta.cerrar = null;
}

/**
 * Contenido que se desliza a la izquierda y deja ver la opción de eliminar (ver `forma`). Solo
 * la muestra: por mucho que se deslice, nunca elimina al soltar. Con un desliz corto queda
 * abierto (no se regresa) y se elimina tocando la opción: el contenido se vuelve polvo
 * empezando por el lado del rojo (dissolve-ui), se cierra el espacio y entonces corre
 * `onDelete`. Si falla, vuelve. Tocar el contenido abierto lo cierra. Con el dedo casi quieto
 * encima, el pulso no lo mueve. Solo se anima `transform` (y el ancho del rojo), nada de capas.
 */
export function DeslizarConBoton({
  children,
  onDelete,
  disabled = false,
  forma = "fila",
  colorAccion = "#EF4444",
  radioArriba = 0,
  radioAbajo = 0,
  radio = 0,
  sombra,
  separacion = 0,
  alineacion = "flex-start",
}: {
  children: ReactNode;
  /** Corre cuando el contenido ya se disolvió y se cerró: aquí se elimina el dato. Si falla, vuelve. */
  onDelete: () => Promise<void> | void;
  disabled?: boolean;
  forma?: FormaDeslizar;
  colorAccion?: string;
  /** fila: esquinas de arriba (primera fila de una tarjeta): el rojo no las cuadra */
  radioArriba?: number;
  /** fila: esquinas de abajo (última fila de una tarjeta) */
  radioAbajo?: number;
  /** tarjeta: radio de sus esquinas (la píldora y el recorte lo siguen) */
  radio?: number;
  /** tarjeta: su sombra va por fuera del recorte (si no, se cortaría) */
  sombra?: StyleProp<ViewStyle>;
  /** tarjeta: espacio debajo (entre tarjetas): se cierra con ella al eliminarla */
  separacion?: number;
  /** burbuja: de qué lado de la conversación está */
  alineacion?: "flex-start" | "flex-end";
}) {
  const { ref, dissolving, dissolve, reset } = useDissolve();
  const anchoAbierta = ANCHO_ABIERTA[forma];
  // Lo deslizado por el dedo, entre -anchoAbierta (abierta) y 0
  const tx = useSharedValue(0);
  // Alto de la envoltura: -1 = el natural; al eliminar baja hasta 0
  const alto = useSharedValue(-1);
  const medido = useSharedValue(0);
  // Dónde estaba al empezar a arrastrar
  const inicio = useSharedValue(0);
  // Al eliminar: 0 = como está, 1 = todo cubierto de rojo (justo antes del polvo)
  const cubrir = useSharedValue(0);
  // fila y tarjeta: su ancho completo, hasta donde crece el rojo al cubrirlas
  const anchoTotal = useSharedValue(0);
  // burbuja: qué tanto está abierta (0 a 1)
  const apertura = useDerivedValue(() =>
    Math.min(1, Math.max(0, -tx.get() / anchoAbierta)),
  );
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

  // En modo de selección no se queda abierta: se cierra y, al terminar, se avisa
  useEffect(() => {
    if (!disabled) return;
    tx.set(
      withTiming(0, { duration: 260, easing: CALM }, (terminado) => {
        if (terminado) scheduleOnRN(setAbierta, false);
      }),
    );
  }, [disabled, tx]);
  // Al desmontar deja de ser lo abierto
  useEffect(() => () => soltarAbierta(cerrar), [cerrar]);

  const eliminar = async () => {
    try {
      await onDelete();
    } catch {
      alto.set(-1);
      tx.set(0);
      cubrir.set(0);
      reset();
      setEliminando(false);
      alCerrar();
    }
  };

  const confirmar = () => {
    if (eliminando) return;
    setEliminando(true);
    cubrir.set(
      withTiming(1, CUBRIR, (terminado) => {
        if (terminado) scheduleOnRN(disolver);
      }),
    );
  };

  const disolver = async () => {
    try {
      // Empieza por el lado del rojo. Más corto que el de serie: arranca y termina rápido
      await dissolve({
        preset: "dust",
        duration: DURACION_POLVO,
        origin: "right",
      });
    } catch {
      // El efecto es solo visual (la web no puede capturar la vista): igual se elimina
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
    // así no brinca esos píxeles de golpe y sigue al dedo desde donde está
    .onStart((e) => {
      inicio.set(tx.get() - e.translationX);
    })
    // Se calcula desde donde empezó el dedo (no sumando cuadro a cuadro): sin acumular errores
    .onUpdate((e) => {
      const crudo = inicio.get() + e.translationX;
      let destino: number;
      if (crudo > 0) {
        // Hacia la derecha no hay nada: banda elástica corta
        destino = crudo * 0.2;
      } else if (crudo < -anchoAbierta) {
        // Pasada la opción casi no se mueve: nunca llega a eliminar
        destino = -anchoAbierta - (-crudo - anchoAbierta) * RESISTENCIA;
      } else {
        destino = crudo;
      }
      // Dedo casi quieto: el pulso no lo mueve (si no, temblaba al sostenerlo)
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
      const veniaAbierta = inicio.get() <= -anchoAbierta / 2;
      const cerrarla = veniaAbierta
        ? v > INTENCION || jalado < anchoAbierta * 0.6
        : v > INTENCION || jalado < ABRE_CON;
      tx.set(
        withSpring(cerrarla ? 0 : -anchoAbierta, { ...RESORTE, velocity: v }),
      );
      scheduleOnRN(cerrarla ? alCerrar : alAbrir);
    });

  const estiloContenido = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.get() }],
  }));
  // fila: el rojo mide lo que se deslizó, siempre pegado al borde derecho
  // tarjeta: la píldora ocupa lo deslizado menos la separación con la tarjeta
  // Al eliminar, crece hasta cubrir toda la fila o tarjeta (con su forma); su icono se queda
  // en su lugar, así no se ve todo rojo
  const estiloAccion = useAnimatedStyle(() => {
    const abierto = Math.max(
      0,
      -tx.get() - (forma === "tarjeta" ? SEPARACION_TARJETA : 0),
    );
    return { width: abierto + (anchoTotal.get() - abierto) * cubrir.get() };
  });
  // Icono de la píldora: aparece conforme se desliza
  const estiloAparece = useAnimatedStyle(() => {
    const p = interpolate(
      -tx.get(),
      [anchoAbierta * 0.25, anchoAbierta],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: p, transform: [{ scale: 0.6 + p * 0.4 }] };
  });
  const estiloEnvoltura = useAnimatedStyle(() =>
    alto.get() < 0 ? {} : { height: alto.get(), overflow: "hidden" },
  );

  const alMedir = (e: LayoutChangeEvent) => {
    anchoTotal.set(e.nativeEvent.layout.width);
    if (alto.get() < 0) medido.set(e.nativeEvent.layout.height + separacion);
  };
  // Abierta, tocar el contenido lo cierra en lugar de abrirlo
  const tapaCerrar = abierta ? (
    <Pressable
      accessibilityLabel="Cerrar opciones"
      onPress={cerrar}
      style={StyleSheet.absoluteFill}
    />
  ) : null;
  // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
  const refCaptura = ref as unknown as RefObject<ComponentRef<typeof View>>;

  const estado: EstadoEliminar = {
    cubrir,
    apertura,
    abierta,
    eliminando,
    confirmar,
    cerrar,
  };

  if (forma === "burbuja") {
    // La burbuja no se mueve: se alarga (ver `useAperturaBurbuja`) y su botón va dentro
    return (
      <EliminarContext.Provider value={estado}>
        <Animated.View style={estiloEnvoltura}>
          <GestureDetector gesture={arrastre}>
            {/* Vista normal: guarda el ref de la captura del polvo */}
            <View
              ref={refCaptura}
              collapsable={false}
              onLayout={alMedir}
              style={{ alignItems: alineacion, opacity: dissolving ? 0 : 1 }}
            >
              {children}
            </View>
          </GestureDetector>
        </Animated.View>
      </EliminarContext.Provider>
    );
  }

  if (forma === "tarjeta") {
    return (
      <EliminarContext.Provider value={estado}>
        <Animated.View style={[{ paddingBottom: separacion }, estiloEnvoltura]}>
          <GestureDetector gesture={arrastre}>
            {/* La sombra por fuera: el recorte de adentro la cortaría */}
            <View collapsable={false} style={[{ borderRadius: radio }, sombra]}>
              {/* Recortada con la forma de la tarjeta: al deslizarse, la tarjeta y la píldora
                quedan dentro de esa misma forma, con las esquinas redondas */}
              <View
                ref={refCaptura}
                collapsable={false}
                onLayout={alMedir}
                style={{
                  borderRadius: radio,
                  overflow: "hidden",
                  opacity: dissolving ? 0 : 1,
                }}
              >
                <Animated.View style={estiloContenido}>
                  {children}
                  {tapaCerrar}
                </Animated.View>
                <Animated.View
                  style={[
                    styles.accion,
                    { backgroundColor: colorAccion, borderRadius: radio },
                    estiloAccion,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar"
                    disabled={!abierta || eliminando}
                    onPress={confirmar}
                    style={[
                      styles.boton,
                      { width: anchoAbierta - SEPARACION_TARJETA },
                    ]}
                  >
                    <Animated.View style={estiloAparece}>
                      <IconoEliminarLinea size={24} color="#FFFFFF" />
                    </Animated.View>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      </EliminarContext.Provider>
    );
  }

  return (
    <EliminarContext.Provider value={estado}>
      <Animated.View style={estiloEnvoltura}>
        <GestureDetector gesture={arrastre}>
          {/* Vista normal: guarda el ref de la captura del polvo */}
          <View
            ref={refCaptura}
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
            <Animated.View style={estiloContenido}>
              {children}
              {tapaCerrar}
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
                style={[
                  styles.boton,
                  styles.botonFila,
                  { width: anchoAbierta },
                ]}
              >
                <IconoEliminarLinea size={24} color="#FFFFFF" />
                <Text style={styles.texto}>Eliminar</Text>
              </Pressable>
            </Animated.View>
          </View>
        </GestureDetector>
      </Animated.View>
    </EliminarContext.Provider>
  );
}

const styles = StyleSheet.create({
  contenedor: { overflow: "hidden" },
  // Pegado a la derecha; su ancho sigue al desliz
  accion: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    overflow: "hidden",
    alignItems: "flex-end",
  },
  // El icono queda en su lugar aunque el rojo crezca
  boton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  botonFila: { gap: 4 },
  texto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  // El icono de la capa roja, en el mismo lugar que en el botón de la burbuja
  tapaRoja: { alignItems: "flex-end" },
  iconoTapa: { width: ESPACIO_BOTON_BURBUJA },
});
