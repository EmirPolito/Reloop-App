import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Modal para confirmar que se cierra la sesión: pregunta y ofrece Cancelar o Cerrar sesión.
 * Tocar fuera lo cierra, como Cancelar. Mismo estilo que el de eliminar publicación.
 */
export function ConfirmarCerrarSesion({
  visible,
  cerrando,
  onCancelar,
  onConfirmar,
}: {
  visible: boolean;
  cerrando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#6B6B70";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancelar}
    >
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(120)}
        style={estilos.fondo}
      >
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={cerrando ? undefined : onCancelar}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          entering={ZoomIn.duration(180)}
          style={[
            estilos.tarjeta,
            { backgroundColor: isDark ? "#1C202B" : "#FFFFFF" },
          ]}
        >
          <Text style={[estilos.titulo, { color: texto }]}>
            ¿Cerrar sesión?
          </Text>
          <Text style={[estilos.mensaje, { color: suave }]}>
            Tendrás que iniciar sesión de nuevo para volver a entrar a tu
            cuenta.
          </Text>
          <View style={estilos.botones}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              disabled={cerrando}
              onPress={onCancelar}
              scaleTo={0.96}
              style={[
                estilos.boton,
                { backgroundColor: isDark ? "#ffffff14" : "#F1F1F3" },
              ]}
            >
              <Text style={[estilos.textoBoton, { color: texto }]}>
                Cancelar
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              disabled={cerrando}
              onPress={onConfirmar}
              scaleTo={0.96}
              style={[
                estilos.boton,
                { backgroundColor: "#F20000", opacity: cerrando ? 0.6 : 1 },
              ]}
            >
              <Text style={[estilos.textoBoton, { color: "#FFFFFF" }]}>
                {cerrando ? "Cerrando…" : "Cerrar sesión"}
              </Text>
            </PressableScale>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  tarjeta: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  titulo: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  mensaje: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  botones: { flexDirection: "row", gap: 10, marginTop: 14 },
  boton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBoton: { fontFamily: "Inter_600SemiBold", fontSize: 14.5 },
});
