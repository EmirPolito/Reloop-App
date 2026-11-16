import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { ENTRADA_MODULO } from "@/constants/motion";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import type { DocumentoLegal } from "./textosLegales";

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

/**
 * Documento legal (política de privacidad o términos) en su propia pantalla, para leerlo
 * desde los ajustes del perfil: botón de volver y título arriba (como en Notificaciones) y
 * el texto debajo, con desplazamiento.
 */
export function PantallaLegal({ documento }: { documento: DocumentoLegal }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#6B6B6B";
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: isDark ? "#ffffff33" : "#ffffff",
  };

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={styles.barra}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={26} color={texto} />
          </View>
        </PressableScale>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[styles.titulo, { color: texto }]}
        >
          {documento.titulo}
        </Text>
        {/* Mismo ancho que el botón de volver: así el título queda centrado */}
        <View style={styles.botonBarra} />
      </View>

      <Animated.View entering={ENTRADA} style={styles.pantalla}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contenido,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Text style={[styles.actualizado, { color: suave }]}>
            {documento.actualizado}
          </Text>
          {documento.secciones.map((seccion) => (
            <View key={seccion.titulo} style={styles.seccion}>
              <Text
                accessibilityRole="header"
                style={[styles.seccionTitulo, { color: texto }]}
              >
                {seccion.titulo}
              </Text>
              {seccion.parrafos.map((parrafo) => (
                <Text key={parrafo} style={[styles.parrafo, { color: suave }]}>
                  {parrafo}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  botonBarra: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  contenido: { paddingHorizontal: 20, paddingTop: 14, gap: 18 },
  actualizado: { fontFamily: "Inter_400Regular", fontSize: 13 },
  seccion: { gap: 6 },
  seccionTitulo: { fontFamily: "Inter_600SemiBold", fontSize: 15.5 },
  parrafo: { fontFamily: "Inter_400Regular", fontSize: 14.5, lineHeight: 21 },
});
