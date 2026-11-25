import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, useBottomSheetAnimation } from "heroui-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PALETA } from "../drawer/temaDrawer";
import { INTER } from "./editarTema";

/**
 * Drawer de la pantalla Editar perfil (BottomSheet de HeroUI): línea arriba, título al
 * centro, X a la derecha y, opcional, flecha para volver a la izquierda. Su alto se ajusta
 * al contenido, así que al cambiar de paso crece o se encoge con animación.
 */
export function SheetEditar({
  visible,
  titulo,
  isDark,
  onClose,
  onCerrado,
  onBack,
  permitirArrastrarContenido = true,
  bloqueado = false,
  hostName,
  children,
}: {
  visible: boolean;
  titulo: string;
  isDark: boolean;
  onClose: () => void;
  /** Cuando terminó de bajar (ya no se ve) */
  onCerrado?: () => void;
  onBack?: () => void;
  /** En false, solo la línea de arriba arrastra el sheet (para gestos dentro del contenido) */
  permitirArrastrarContenido?: boolean;
  /** No se puede cerrar (sin X, sin arrastrar ni tocar fuera): configuración inicial */
  bloqueado?: boolean;
  /**
   * Capa donde se dibuja (un `PortalHost` con ese nombre). La de HeroUI está por encima de los
   * providers de la sesión: el contenido que los necesita usa `HOST_SESION`.
   */
  hostName?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const p = PALETA[isDark ? "oscuro" : "claro"];
  // Baja ~22 px en iPhone con Face ID sin pegarse a 0 en Android; usa 6 u 8 fijo si la quieres aún más abajo
  const margenInferior = Math.max(insets.bottom - 22, 6);

  return (
    <BottomSheet
      isOpen={visible}
      onOpenChange={(open) => {
        if (!open && !bloqueado) onClose();
      }}
    >
      {/* En iOS, sin la ventana nativa de HeroUI (FullWindowOverlay): esa ventana tapa a la
          galería y la foto elegida no regresaba. Como vista normal, la galería se abre encima. */}
      <BottomSheet.Portal disableFullWindowOverlay hostName={hostName}>
        <FondoOscuro
          visible={visible}
          onPress={bloqueado ? undefined : onClose}
        />
        <BottomSheet.Content
          enablePanDownToClose={!bloqueado}
          onClose={onCerrado}
          enableContentPanningGesture={permitirArrastrarContenido}
          // Card flotante: separada de los lados y más cerca del borde inferior
          detached
          bottomInset={margenInferior}
          className="mx-2"
          // El radio y el color van por style: el CSS de HeroUI solo redondea las esquinas de arriba
          backgroundStyle={{
            borderRadius: RADIO_CARD,
            backgroundColor: FONDO_CARD[isDark ? 1 : 0],
          }}
          // HeroUI agrega pb-safe-offset-3 (zona segura + 12): con bottomInset la zona segura
          // contaría doble y el contenido quedaría muy arriba
          contentContainerClassName="px-0 pt-0 pb-0"
          contentContainerProps={{ style: { paddingBottom: 0 } }}
          // Sin estirarse: no se arrastra más allá de su alto y nunca pasa del alto disponible
          enableOverDrag={false}
          // Al bajar el teclado el drawer vuelve a su alto (antes se quedaba estirado)
          keyboardBlurBehavior="restore"
          maxDynamicContentSize={altoVentana - insets.top - margenInferior - 34}
        >
          <View style={styles.header}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver"
                onPress={onBack}
                style={[
                  styles.boton,
                  styles.izquierda,
                  { backgroundColor: p.cerrarFondo },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={p.texto} />
              </Pressable>
            ) : null}

            <BottomSheet.Title
              style={[
                INTER.semibold,
                { fontSize: 15, color: p.texto, textAlign: "center" },
              ]}
            >
              {titulo}
            </BottomSheet.Title>

            {bloqueado ? null : (
              // Botón propio (como el de volver): cierra llamando directamente a `onClose`
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                hitSlop={8}
                onPress={onClose}
                style={[
                  styles.boton,
                  styles.derecha,
                  { backgroundColor: p.cerrarFondo },
                ]}
              >
                <Ionicons name="close" size={18} color={p.texto} />
              </Pressable>
            )}
          </View>

          <View style={{ paddingBottom: 14 }}>{children}</View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

/**
 * El fondo oscuro detrás de la card. Reemplaza al `BottomSheet.Overlay` de HeroUI: ese se
 * quita de golpe en cuanto el drawer se cierra con la X o al guardar, y el salto (más el
 * desmontaje en el primer cuadro del cierre) hacía que la salida se sintiera trabada. Este
 * sigue montado y se desvanece al mismo ritmo que baja la card, en el hilo de UI.
 */
function FondoOscuro({
  visible,
  onPress,
}: {
  visible: boolean;
  /** Sin esto, tocar fuera no cierra (configuración inicial) */
  onPress?: () => void;
}) {
  // 0 cerrado, 1 abierto y 2 cerrándose: sigue la posición de la card cuadro a cuadro
  const { progress } = useBottomSheetAnimation();
  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1, 2], [0, 1, 0]),
  }));
  return (
    <Animated.View
      // Cerrándose ya no ataja toques: se puede tocar la pantalla mientras se desvanece
      pointerEvents={visible ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, styles.fondo, estilo]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar"
        disabled={!onPress}
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Lo que ocupa el encabezado sobre el contenido: alto 33, subido 7 y 20 de margen abajo */
export const ALTO_ENCABEZADO = 33 - 7 + 20;

/** Capa de drawers dentro de los providers de la sesión (su `PortalHost` va en el layout de la app) */
export const HOST_SESION = "sesion";

export const RADIO_CARD = 35;
/** Fondo de la card: [claro, oscuro] */
/**
 * En oscuro, el mismo tono con el que se ven las tarjetas de opciones del perfil (blanco al
 * 5 % sobre el fondo #161616), pero sólido
 */
export const FONDO_CARD = ["#ffffff", "#222222"] as const;

const styles = StyleSheet.create({
  // El mismo tono que el fondo de HeroUI (negro al 20 %)
  fondo: { backgroundColor: "rgba(0, 0, 0, 0.2)" },
  // Mismo alto que los botones y subido 7 px: el título queda a la altura de la X
  header: {
    height: 33,
    marginTop: -7,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  boton: {
    position: "absolute",
    top: 0,
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  izquierda: { left: 16 },
  derecha: { right: 16 },
});
