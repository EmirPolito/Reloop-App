import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "heroui-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LETRA, RADIO_HOJA, coloresOnboarding } from "../temaOnboarding";

/**
 * Drawer propio de la configuración inicial, con el mismo estilo que el de elegir avatar:
 * card flotante, línea arriba, título al centro y flecha para volver a la izquierda. No se
 * puede cerrar (ni arrastrando ni tocando fuera) hasta terminar.
 */
export function HojaOnboarding({
  visible,
  titulo,
  isDark,
  onBack,
  altoMinimo,
  children,
}: {
  visible: boolean;
  titulo: string;
  isDark: boolean;
  onBack?: () => void;
  /** Alto mínimo del contenido (para igualar al drawer de avatar) */
  altoMinimo?: number;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const c = coloresOnboarding(isDark);
  const margenInferior = Math.max(insets.bottom - 22, 6);

  return (
    <BottomSheet isOpen={visible} onOpenChange={() => {}}>
      {/* Sin la ventana nativa de HeroUI: así la galería se abre encima en iOS */}
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          enablePanDownToClose={false}
          detached
          bottomInset={margenInferior}
          className="mx-2"
          backgroundStyle={{
            borderRadius: RADIO_HOJA,
            backgroundColor: c.hoja,
          }}
          contentContainerClassName="px-0 pt-0 pb-0"
          contentContainerProps={{ style: { paddingBottom: 0 } }}
          enableOverDrag={false}
          keyboardBlurBehavior="restore"
          maxDynamicContentSize={altoVentana - insets.top - margenInferior - 34}
        >
          <View style={styles.header}>
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Volver"
                onPress={onBack}
                style={[styles.volver, { backgroundColor: c.botonHeader }]}
              >
                <Ionicons name="chevron-back" size={18} color={c.texto} />
              </Pressable>
            ) : null}
            <BottomSheet.Title
              style={[
                LETRA.semibold,
                { fontSize: 15, color: c.texto, textAlign: "center" },
              ]}
            >
              {titulo}
            </BottomSheet.Title>
          </View>

          <View style={{ paddingBottom: 14, minHeight: altoMinimo }}>
            {children}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 33,
    marginTop: -7,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  volver: {
    position: "absolute",
    top: 0,
    left: 16,
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
