import { Ionicons } from "@expo/vector-icons";
import { Fragment, type ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT } from "@/constants/motion";
import { coloresTarjetaVendedor } from "@/features/perfil/components/TarjetaVendedor";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

export interface OpcionMenu {
  etiqueta: string;
  icono: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  deshabilitada?: boolean;
}

/**
 * Tarjeta de opciones que sale bajo el botón del encabezado (arriba a la derecha), con el mismo
 * diseño que el menú de la conversación: fondo que oscurece un poco la pantalla, tarjeta blanca
 * redondeada, icono a la izquierda del texto y una línea entre opciones. Tocar fuera la cierra.
 */
export function MenuOpciones({
  visible,
  top,
  opciones,
  onClose,
}: {
  visible: boolean;
  /** Distancia desde arriba de la pantalla (la ventana, con la barra de estado) hasta la tarjeta */
  top: number;
  opciones: OpcionMenu[];
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  const tinta = isDark ? "#F1F5F9" : "#101010";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú"
        style={[styles.fondo, { paddingTop: top + 4 }]}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeInUp.duration(150).easing(EASE_OUT)}
          style={[
            styles.tarjeta,
            // En oscuro, el mismo fondo neutro de las tarjetas (el de antes se veía azul)
            {
              backgroundColor: isDark
                ? coloresTarjetaVendedor(true).fondo
                : "#FFFFFF",
            },
          ]}
        >
          {opciones.map((opcion, indice) => (
            <Fragment key={opcion.etiqueta}>
              {indice > 0 ? (
                <View
                  style={[
                    styles.linea,
                    // En oscuro apenas se nota
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "#f5f5f5ff",
                    },
                  ]}
                />
              ) : null}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={opcion.etiqueta}
                accessibilityState={{ disabled: opcion.deshabilitada }}
                disabled={opcion.deshabilitada}
                scaleTo={0.97}
                onPress={() => {
                  onClose();
                  opcion.onPress();
                }}
                style={[styles.opcion, opcion.deshabilitada && styles.apagada]}
              >
                <Ionicons name={opcion.icono} size={21} color={tinta} />
                <Text style={[styles.etiqueta, { color: tinta }]}>
                  {opcion.etiqueta}
                </Text>
              </PressableScale>
            </Fragment>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#00000028",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 15,
  },
  tarjeta: { borderRadius: 20, paddingVertical: 5, minWidth: 170 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  apagada: { opacity: 0.45 },
  linea: { height: 1 },
  etiqueta: { marginLeft: 13, fontSize: 14.5, fontWeight: "500" },
});
