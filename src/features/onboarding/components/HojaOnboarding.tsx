import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "heroui-native";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LETRA, RADIO_HOJA, coloresOnboarding } from "../temaOnboarding";

/** Lo que tarda una página en deslizarse al cambiar de paso */
export const DESLIZAMIENTO_ONBOARDING_MS = 300;
/** Alto del contenido mientras aún no se mide la primera página */
const ALTO_INICIAL = 280;

export type DireccionPaso = "adelante" | "atras";

/**
 * Drawer propio de la configuración inicial, con el mismo estilo que el de elegir avatar:
 * card flotante, título al centro y flecha para volver a la izquierda. No se puede cerrar (ni
 * arrastrando ni tocando fuera) hasta terminar. Es una sola card para todos los pasos: el
 * contenido de cada uno entra deslizándose desde la derecha, como pasar una hoja (y sale hacia
 * la derecha al volver). Su alto sigue al de la página actual, nunca menor que `altoMinimo`.
 */
export function HojaOnboarding({
  visible,
  titulo,
  paso,
  direccion,
  isDark,
  onBack,
  altoMinimo,
  tituloNegrita = false,
  permitirArrastrarContenido = true,
  children,
}: {
  visible: boolean;
  titulo: string;
  /** Índice del paso actual: la página se vuelve a montar (y se desliza) al cambiar */
  paso: number;
  direccion: DireccionPaso;
  isDark: boolean;
  onBack?: () => void;
  /** Alto mínimo del contenido (para igualar al de avatar) */
  altoMinimo?: number;
  /** Título en negrita */
  tituloNegrita?: boolean;
  /** En false, solo se arrastra la card desde arriba (para gestos dentro del contenido) */
  permitirArrastrarContenido?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const c = coloresOnboarding(isDark);
  const margenInferior = Math.max(insets.bottom - 22, 6);

  // Las páginas se apilan una sobre otra mientras se deslizan: el alto de la card lo fija la
  // medida de la página actual
  const [medida, setMedida] = useState(0);
  const alto = Math.max(altoMinimo ?? ALTO_INICIAL, medida);

  // La primera página aparece con la card; solo las siguientes se deslizan
  const [pasoInicial] = useState(paso);
  const [movido, setMovido] = useState(false);
  if (!movido && paso !== pasoInicial) setMovido(true);
  const adelante = direccion === "adelante";

  return (
    <BottomSheet isOpen={visible} onOpenChange={() => {}}>
      {/* Sin la ventana nativa de HeroUI: así la galería se abre encima en iOS */}
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          enablePanDownToClose={false}
          enableContentPanningGesture={permitirArrastrarContenido}
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
                tituloNegrita ? LETRA.bold : LETRA.semibold,
                { fontSize: 15, color: c.texto, textAlign: "center" },
              ]}
            >
              {titulo}
            </BottomSheet.Title>
          </View>

          <View style={{ height: alto, marginBottom: 14, overflow: "hidden" }}>
            <Animated.View
              key={paso}
              entering={
                movido
                  ? (adelante ? SlideInRight : SlideInLeft).duration(
                      DESLIZAMIENTO_ONBOARDING_MS,
                    )
                  : undefined
              }
              exiting={(adelante ? SlideOutLeft : SlideOutRight).duration(
                DESLIZAMIENTO_ONBOARDING_MS,
              )}
              onLayout={(e) => setMedida(e.nativeEvent.layout.height)}
              style={styles.pagina}
            >
              {children}
            </Animated.View>
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
  // Absoluta: así dos páginas pueden convivir mientras una sale y la otra entra
  pagina: { position: "absolute", top: 0, left: 0, right: 0 },
});
