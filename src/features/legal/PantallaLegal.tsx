import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { ENTRADA_MODULO } from "@/constants/motion";
import { COLA_NEBLINA, Neblina } from "@/features/busqueda/components/Neblina";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { useNavegacion } from "@/features/navigation/useNavegacion";
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
/** Créditos: espera antes de empezar a desplazarse solo (ms) */
const ESPERA_CREDITOS = 2000;
/** Créditos: velocidad del desplazamiento automático, lenta para ir leyendo (px/s) */
const VELOCIDAD_CREDITOS = 9;

/**
 * Documento legal (política de privacidad o términos) en su propia pantalla, para leerlo
 * desde los ajustes del perfil. Encabezado flotante sin tarjeta: botón de volver de cristal y
 * título al centro; el texto pasa por detrás y, al hacer scroll, aparece una neblina del color
 * del fondo que lo difumina bajo el título.
 *
 * Con `creditos` (Acerca de la app) se lee como unos créditos: más aire entre apartados, a los
 * 2 s empieza a desplazarse solo, lento, hasta el final (se detiene si la persona lo toca), y
 * cierra con lo que se pase en `creditos` (el logo y los fundadores).
 */
export function PantallaLegal({
  documento,
  creditos,
}: {
  documento: DocumentoLegal;
  creditos?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useNavegacion();
  const texto = isDark ? "#F1F5F9" : "#101010";
  // En oscuro, claro pero no tanto (el gris azulado de antes casi no se leía)
  const suave = isDark ? "#C4C7CC" : "#6B6B6B";
  // Alto del encabezado flotante: el texto empieza debajo de él
  const [altoCabecera, setAltoCabecera] = useState(0);

  const desplazado = useSharedValue(0);
  // Créditos: a dónde lleva el desplazamiento automático (-1 = no está desplazando)
  const destinoAuto = useSharedValue(-1);
  // La persona tocó el scroll: el automático ya no empieza o se detiene donde va
  const tocado = useSharedValue(false);
  const alHacerScroll = useAnimatedScrollHandler({
    onScroll: (event) => desplazado.set(event.contentOffset.y),
    onBeginDrag: () => {
      tocado.set(true);
      cancelAnimation(destinoAuto);
      destinoAuto.set(-1);
    },
  });
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  useDerivedValue(() => {
    const y = destinoAuto.get();
    if (y >= 0) scrollTo(scrollRef, 0, y, false);
  });
  const reducido = useReducedMotion();
  // Medidas del scroll: se leen al momento de arrancar, sin volver a programar la espera cada
  // vez que cambian (antes cada nueva medida cancelaba la espera y nunca arrancaba)
  const medidas = useRef({ vista: 0, contenido: 0 });
  const [medido, setMedido] = useState(false);
  const medir = (cambio: Partial<{ vista: number; contenido: number }>) => {
    Object.assign(medidas.current, cambio);
    if (medidas.current.vista > 0 && medidas.current.contenido > 0) {
      setMedido(true);
    }
  };
  const conCreditos = creditos != null;
  useEffect(() => {
    if (!conCreditos || reducido || !medido) return;
    const espera = setTimeout(() => {
      const maximo = medidas.current.contenido - medidas.current.vista;
      if (maximo <= 0 || tocado.get()) return;
      const desde = desplazado.get();
      destinoAuto.set(desde);
      destinoAuto.set(
        withTiming(maximo, {
          duration: ((maximo - desde) / VELOCIDAD_CREDITOS) * 1000,
          easing: Easing.linear,
        }),
      );
    }, ESPERA_CREDITOS);
    return () => clearTimeout(espera);
  }, [conCreditos, reducido, medido, desplazado, destinoAuto, tocado]);

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
          ref={scrollRef}
          onScroll={alHacerScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => medir({ vista: e.nativeEvent.layout.height })}
          onContentSizeChange={(_, alto) => medir({ contenido: alto })}
          contentContainerStyle={[
            styles.contenido,
            creditos ? styles.contenidoCreditos : null,
            {
              // En los créditos el texto empieza más separado del encabezado
              paddingTop: altoCabecera + (creditos ? 34 : 14),
              paddingBottom: insets.bottom + (creditos ? 12 : 32),
            },
          ]}
        >
          {documento.actualizado ? (
            <Text style={[styles.actualizado, { color: suave }]}>
              {documento.actualizado}
            </Text>
          ) : null}
          {documento.secciones.map((seccion) => (
            <View
              key={seccion.titulo}
              style={[styles.seccion, creditos ? styles.seccionCreditos : null]}
            >
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
              {seccion.puntos ? (
                <View style={styles.puntos}>
                  {seccion.puntos.map((punto) => (
                    <View key={punto} style={styles.punto}>
                      <View
                        style={[styles.vineta, { backgroundColor: suave }]}
                      />
                      <Text
                        style={[
                          styles.parrafo,
                          styles.textoPunto,
                          { color: texto },
                        ]}
                      >
                        {punto}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
          {creditos}
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
  // Créditos: más aire entre apartados y entre párrafos, para leerlo por partes
  contenidoCreditos: { gap: 36 },
  seccionCreditos: { gap: 10 },
  puntos: { gap: 8, marginTop: 4 },
  punto: { flexDirection: "row", alignItems: "center", gap: 10 },
  vineta: { width: 5, height: 5, borderRadius: 2.5 },
  textoPunto: { flex: 1 },
  seccionTitulo: { fontFamily: "Inter_600SemiBold", fontSize: 15.5 },
  parrafo: { fontFamily: "Inter_400Regular", fontSize: 14.5, lineHeight: 21 },
});
