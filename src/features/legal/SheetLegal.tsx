import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet } from "heroui-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import type { DocumentoLegal } from "./textosLegales";

/** Alto del drawer: fijo, para que el texto se desplace dentro y no quede hueco abajo */
const SNAP_POINTS = ["90%"];
const RADIO_CARD = 35;

const COLORES = {
  claro: {
    card: "#FFFFFF",
    texto: "#101010",
    suave: "#6B6B6B",
    boton: "#F2F2F2",
    divisor: "#FFFFFF",
  },
  oscuro: {
    card: "#0B1220",
    texto: "#F1F5F9",
    suave: "#94A3B8",
    boton: "#17233A",
    divisor: "#1E293B",
  },
} as const;

/**
 * Drawer de un documento legal (política de privacidad o términos). Tiene el mismo aspecto
 * que los drawers de Editar perfil —card flotante, título al centro y X a la derecha—, pero
 * con alto fijo: el texto se desplaza dentro y abajo quedan siempre a la vista los botones
 * Cancelar y Aceptar.
 */
export function SheetLegal({
  documento,
  visible,
  isDark,
  onClose,
  onAceptar,
}: {
  documento: DocumentoLegal;
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  /** Aceptar: quien abre el drawer registra la aceptación; el drawer se cierra solo */
  onAceptar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = COLORES[isDark ? "oscuro" : "claro"];
  const margenInferior = Math.max(insets.bottom - 22, 6);

  return (
    <BottomSheet
      isOpen={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached
          bottomInset={margenInferior}
          snapPoints={SNAP_POINTS}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose
          // Solo la línea de arriba arrastra el drawer: los dedos en el texto lo desplazan
          enableContentPanningGesture={false}
          className="mx-2"
          backgroundStyle={{
            borderRadius: RADIO_CARD,
            backgroundColor: c.card,
          }}
          // HeroUI agrega pb-safe-offset-3 y gap por defecto; con bottomInset la zona segura
          // contaría doble y gap-0 evita el hueco extra debajo del título
          contentContainerClassName="h-full gap-0 px-0 pt-0 pb-0"
          contentContainerProps={{ style: { paddingBottom: 0 } }}
        >
          <View style={styles.header}>
            <BottomSheet.Title style={[styles.titulo, { color: c.texto }]}>
              {documento.titulo}
            </BottomSheet.Title>
            <BottomSheet.Close
              accessibilityLabel="Cerrar"
              // Sin el resaltado oscuro de HeroUI al presionar
              feedbackVariant="scale"
              iconProps={{ size: 16, color: c.texto }}
              style={[styles.cerrar, { backgroundColor: c.boton }]}
            />
          </View>

          <BottomSheetScrollView
            style={styles.scroll}
            contentContainerStyle={styles.contenido}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.actualizado, { color: c.suave }]}>
              {documento.actualizado}
            </Text>
            {documento.secciones.map((seccion) => (
              <View key={seccion.titulo} style={styles.seccion}>
                <Text style={[styles.seccionTitulo, { color: c.texto }]}>
                  {seccion.titulo}
                </Text>
                {seccion.parrafos.map((parrafo) => (
                  <Text
                    key={parrafo}
                    style={[styles.parrafo, { color: c.suave }]}
                  >
                    {parrafo}
                  </Text>
                ))}
              </View>
            ))}
          </BottomSheetScrollView>

          <View style={[styles.botones, { borderTopColor: c.divisor }]}>
            <PressableSuave
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={onClose}
              style={[styles.boton, { backgroundColor: c.boton }]}
            >
              <Text style={[styles.botonTexto, { color: c.texto }]}>
                Cancelar
              </Text>
            </PressableSuave>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Aceptar ${documento.titulo}`}
              onPress={() => {
                onAceptar();
                onClose();
              }}
              style={({ pressed }) => [
                styles.boton,
                styles.aceptar,
                pressed && { transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text style={[styles.botonTexto, { color: "#FFFFFF" }]}>
                Aceptar
              </Text>
            </Pressable>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  // Mismo alto que la X y subido 7 px: el título queda a la altura de la X
  header: {
    height: 34,
    marginTop: -5,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    textAlign: "center",
  },
  cerrar: {
    position: "absolute",
    top: 0,
    right: 16,
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  scroll: { flex: 1 },
  contenido: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 16,
    gap: 14,
  },
  actualizado: { fontFamily: "Inter_400Regular", fontSize: 13 },
  seccion: { gap: 6 },
  seccionTitulo: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  parrafo: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  botones: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  boton: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  aceptar: {
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  botonTexto: { fontFamily: "Inter_600SemiBold", fontSize: 14.5 },
});
