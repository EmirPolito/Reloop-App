import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT } from "@/constants/motion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import type { Tarjeta } from "../formatoTarjeta";
import { MasIcon } from "./IconosTarjetas";
import { TarjetaBancaria } from "./TarjetaBancaria";

/** Un poco chicas, pero con los datos legibles */
const ANCHO_TARJETA = 196;
const ALTO_BOTON = 42;
const ENTRADA = (i: number) =>
  FadeInUp.duration(160)
    .delay(i * 35)
    .easing(EASE_OUT);

/**
 * Las tarjetas guardadas, una debajo de otra, para elegir cuál mandar al chat, con el botón
 * de tarjeta nueva primero. Se abre desde la billetera del encabezado con el mismo fondo oscurecido
 * que tenía el menú de la conversación.
 */
export function SelectorTarjetas({
  visible,
  tarjetas,
  onElegir,
  onNueva,
  onClose,
}: {
  visible: boolean;
  tarjetas: readonly Tarjeta[];
  onElegir: (tarjeta: Tarjeta) => void;
  onNueva: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const arriba = insets.top + 68;
  const hayTarjetas = tarjetas.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.fondo} onPress={onClose}>
        <ScrollView
          style={{
            position: "absolute",
            top: arriba,
            right: 15,
            maxHeight: height - arriba - insets.bottom - 16,
          }}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        >
          {/* Primero el botón "+": circular si aún no hay tarjetas; si hay, del ancho de ellas */}
          <Animated.View entering={ENTRADA(0)}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Nueva tarjeta"
              scaleTo={0.95}
              onPress={onNueva}
              style={[
                styles.nueva,
                {
                  backgroundColor: isDark ? "#2A2B32" : "#FFFFFF",
                  width: hayTarjetas ? ANCHO_TARJETA : ALTO_BOTON,
                },
              ]}
            >
              <MasIcon size={18} color={isDark ? "#F1F5F9" : "#101010"} />
            </PressableScale>
          </Animated.View>

          {tarjetas.map((tarjeta, i) => (
            <Animated.View key={tarjeta.id} entering={ENTRADA(i + 1)}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Mandar la tarjeta de ${tarjeta.institucion} que termina en ${tarjeta.clave.slice(-4)}`}
                scaleTo={0.96}
                onPress={() => onElegir(tarjeta)}
              >
                <TarjetaBancaria
                  institucion={tarjeta.institucion}
                  clave={tarjeta.clave}
                  beneficiario={tarjeta.beneficiario}
                  color={tarjeta.color}
                  ancho={ANCHO_TARJETA}
                  claveVisible
                />
              </PressableScale>
            </Animated.View>
          ))}
        </ScrollView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#00000028" },
  lista: { gap: 10, alignItems: "flex-end", paddingBottom: 4 },
  nueva: {
    alignItems: "center",
    justifyContent: "center",
    height: ALTO_BOTON,
    borderRadius: ALTO_BOTON / 2,
  },
});
