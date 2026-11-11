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
  children,
}: {
  visible: boolean;
  titulo: string;
  isDark: boolean;
  onClose: () => void;
  onBack?: () => void;
  /** En false, solo la línea de arriba arrastra el sheet (para gestos dentro del contenido) */
  permitirArrastrarContenido?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const p = PALETA[isDark ? "oscuro" : "claro"];

  return (
    <BottomSheet
      isOpen={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* En iOS, sin la ventana nativa de HeroUI (FullWindowOverlay): esa ventana tapa a la
          galería y la foto elegida no regresaba. Como vista normal, la galería se abre encima. */}
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          enablePanDownToClose
          enableContentPanningGesture={permitirArrastrarContenido}
          // Card flotante: separada de los lados y de abajo, con todas las esquinas redondas
          detached
          bottomInset={insets.bottom + 6}
          className="mx-1.5"
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
          maxDynamicContentSize={altoVentana - insets.top - insets.bottom - 40}
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

            <BottomSheet.Close
              accessibilityLabel="Cerrar"
              iconProps={{ size: 16, color: p.texto }}
              style={[
                styles.boton,
                styles.derecha,
                { backgroundColor: p.cerrarFondo },
              ]}
            />
          </View>

          <View style={{ paddingBottom: 18 }}>{children}</View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const RADIO_CARD = 30;
/** Fondo de la card: [claro, oscuro] (mismos colores que PALETA.sheet) */
const FONDO_CARD = ["#ffffff", "#0B1220"] as const;

const styles = StyleSheet.create({
  header: {
    height: 40,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  boton: {
    position: "absolute",
    top: -7,
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
