import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { ENTRADA_MODULO } from "@/constants/motion";
import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";
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

/** Icono del botón de volver (el mismo de los demás módulos) */
const ICONO_ATRAS = 28;
/** Scroll en el que la neblina termina de aparecer */
const TRAMO_NEBLINA = 24;
/** Lo que la neblina baja de más bajo la barra, además de su cola normal */
const EXTRA_NEBLINA = 16;
/** Cuánto baja, desde la hora, la parte que tapa casi por completo */
const BAJO_CORTE = 22;

/**
 * Documento legal (política de privacidad o términos) en su propia pantalla, para leerlo
 * desde los ajustes del perfil. Encabezado flotante sin tarjeta: botón de volver de cristal y
 * título al centro; el texto pasa por detrás y, al hacer scroll, aparece una neblina del color
 * del fondo que lo difumina bajo el título.
 */
export function PantallaLegal({ documento }: { documento: DocumentoLegal }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#6B6B6B";
  // Alto del encabezado flotante: el texto empieza debajo de él
  const [altoCabecera, setAltoCabecera] = useState(0);

  const desplazado = useSharedValue(0);
  const alHacerScroll = useAnimatedScrollHandler((event) => {
    desplazado.set(event.contentOffset.y);
  });
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(desplazado.get() / TRAMO_NEBLINA, 0), 1),
  }));

  // Tapa por completo la hora y de ahí se desvanece a lo largo de la barra, hasta un poco debajo
  const paddingTop = insets.top + 8;
  const altoNeblina = altoCabecera + COLA_NEBLINA + EXTRA_NEBLINA;
  // La parte que tapa casi por completo baja hasta media altura del botón de volver
  const corteNeblina =
    altoCabecera > 0 ? (paddingTop + BAJO_CORTE) / altoNeblina : undefined;

  return (
    <View style={styles.pantalla}>
      <Animated.View entering={ENTRADA} style={styles.pantalla}>
        <Animated.ScrollView
          onScroll={alHacerScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contenido,
            {
              paddingTop: altoCabecera + 14,
              paddingBottom: insets.bottom + 32,
            },
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
        </Animated.ScrollView>
      </Animated.View>

      {/* Encabezado flotante, sin tarjeta de fondo: el texto pasa por detrás */}
      <View
        pointerEvents="box-none"
        style={[styles.cabecera, { paddingTop }]}
        onLayout={(e) => setAltoCabecera(e.nativeEvent.layout.height)}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.neblina, { height: altoNeblina }, estiloNeblina]}
        >
          <Neblina style={StyleSheet.absoluteFill} corte={corteNeblina} />
        </Animated.View>

        <View pointerEvents="box-none" style={styles.barra}>
          <BotonBarra etiqueta="Volver" onPress={() => conSalida(back)}>
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={ICONO_ATRAS} color={texto} />
            </View>
          </BotonBarra>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            pointerEvents="none"
            style={[styles.titulo, { color: texto }]}
          >
            {documento.titulo}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cabecera: { position: "absolute", top: 0, left: 0, right: 0 },
  neblina: { position: "absolute", top: 0, left: 0, right: 0 },
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  // Centrado en la barra, sin importar el ancho del botón
  titulo: {
    position: "absolute",
    left: 80,
    right: 80,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  contenido: { paddingHorizontal: 20, gap: 18 },
  actualizado: { fontFamily: "Inter_400Regular", fontSize: 13 },
  seccion: { gap: 6 },
  seccionTitulo: { fontFamily: "Inter_600SemiBold", fontSize: 15.5 },
  parrafo: { fontFamily: "Inter_400Regular", fontSize: 14.5, lineHeight: 21 },
});
