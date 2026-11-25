import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import { textoParaCopiar, type TarjetaCompartida } from "../formatoTarjeta";
import { CopiarIcon } from "./IconosTarjetas";
import { TarjetaBancaria } from "./TarjetaBancaria";

const ANCHO = 236;

/**
 * La tarjeta que alguien mandó al chat para recibir una transferencia: solo la tarjeta (sin la
 * funda), con la institución, la clave y el beneficiario, y "Copiar datos", que copia eso.
 */
export function TarjetaChat({
  tarjeta,
  hora,
  mia,
}: {
  tarjeta: TarjetaCompartida;
  hora: string;
  mia: boolean;
}) {
  const { isDark } = useAppTheme();
  const { mostrar } = useAvisos();
  const tinta = isDark ? "#F1F5F9" : "#101010";

  async function copiar() {
    try {
      await Clipboard.setStringAsync(textoParaCopiar(tarjeta));
    } catch (error) {
      showErrorAlert("No se pudieron copiar los datos", error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined,
    );
    mostrar({
      tipo: "exito",
      titulo: "Datos copiados",
      descripcion: "Se copiaron el beneficiario, la institución y la CLABE.",
    });
  }

  return (
    <View
      style={[
        styles.contenedor,
        { alignSelf: mia ? "flex-end" : "flex-start" },
      ]}
    >
      <TarjetaBancaria
        institucion={tarjeta.institucion}
        clave={tarjeta.clave}
        beneficiario={tarjeta.beneficiario}
        color={tarjeta.color}
        ancho={ANCHO}
        claveVisible
      />
      <View style={styles.fila}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Copiar el beneficiario, la institución y la CLABE"
          scaleTo={0.95}
          onPress={() => void copiar()}
          style={[
            styles.copiar,
            { backgroundColor: isDark ? "#2A2B32" : "#FFFFFF" },
          ]}
        >
          <CopiarIcon size={15} color={tinta} />
          <Text style={[styles.textoCopiar, { color: tinta }]}>
            Copiar datos
          </Text>
        </PressableScale>
        <Text style={styles.hora}>{hora}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: ANCHO, marginVertical: 5, gap: 7 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copiar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
  },
  textoCopiar: { fontSize: 13, fontWeight: "500", top: 1 },
  hora: { fontSize: 11.5, color: "#9CA3AF", top: 1 },
});
