import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "heroui-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PALETA } from "../drawer/drawerTheme";
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
  onBack,
  permitirArrastrarContenido = true,
  bloqueado = false,
  children,
}: {
  visible: boolean;
  titulo: string;
  isDark: boolean;
  onClose: () => void;
  onBack?: () => void;
  /** En false, solo la línea de arriba arrastra el sheet (para gestos dentro del contenido) */
  permitirArrastrarContenido?: boolean;
  /** No se puede cerrar (sin X, sin arrastrar ni tocar fuera): configuración inicial */
  bloqueado?: boolean;
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
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          enablePanDownToClose={!bloqueado}
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
              <BottomSheet.Close
                accessibilityLabel="Cerrar"
                // Sin el resaltado oscuro de HeroUI al presionar
                feedbackVariant="scale"
                iconProps={{ size: 16, color: p.texto }}
                style={[
                  styles.boton,
                  styles.derecha,
                  { backgroundColor: p.cerrarFondo },
                ]}
              />
            )}
          </View>

          <View style={{ paddingBottom: 14 }}>{children}</View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const RADIO_CARD = 35;
/** Fondo de la card: [claro, oscuro] (mismos colores que PALETA.sheet) */
const FONDO_CARD = ["#ffffff", "#0B1220"] as const;

const styles = StyleSheet.create({
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
