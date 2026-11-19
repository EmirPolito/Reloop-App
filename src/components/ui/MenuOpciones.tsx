import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

export interface OpcionMenu {
  etiqueta: string;
  icono: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  deshabilitada?: boolean;
}

/**
 * Tarjeta de opciones que sale bajo el botón del encabezado (arriba a la derecha). Tocar
 * fuera la cierra. Va dentro de la pantalla, a pantalla completa y sobre todo lo demás.
 */
export function MenuOpciones({
  visible,
  top,
  opciones,
  onClose,
}: {
  visible: boolean;
  /** Distancia desde arriba de la pantalla hasta la tarjeta */
  top: number;
  opciones: OpcionMenu[];
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  if (!visible) return null;

  const texto = isDark ? "#F1F5F9" : "#101010";
  return (
    <View style={styles.capa} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        entering={FadeIn.duration(120)}
        exiting={FadeOut.duration(90)}
        style={[
          styles.tarjeta,
          { top, backgroundColor: isDark ? "#262626" : "#FFFFFF" },
        ]}
      >
        {opciones.map((opcion, indice) => (
          <PressableSuave
            key={opcion.etiqueta}
            accessibilityRole="button"
            accessibilityLabel={opcion.etiqueta}
            disabled={opcion.deshabilitada}
            onPress={() => {
              onClose();
              opcion.onPress();
            }}
            style={[
              styles.opcion,
              indice > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "#ffffff1f" : "#0000001a",
              },
              opcion.deshabilitada && { opacity: 0.45 },
            ]}
          >
            <Text style={[styles.etiqueta, { color: texto }]}>
              {opcion.etiqueta}
            </Text>
            <Ionicons name={opcion.icono} size={20} color={texto} />
          </PressableSuave>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50 },
  tarjeta: {
    position: "absolute",
    right: 16,
    minWidth: 208,
    borderRadius: 18,
    paddingHorizontal: 6,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
  },
  opcion: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  etiqueta: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
