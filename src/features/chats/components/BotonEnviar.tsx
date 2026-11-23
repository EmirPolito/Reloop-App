import { memo } from "react";
import { ActivityIndicator, View, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { ALTO_PILDORA } from "@/features/busqueda/components/PildoraCristal";
import { SendIcon } from "./IconosConversacion";

/** Mismo fondo que la burbuja de mis mensajes */
const COLOR_MI_BURBUJA = "#272727";

// Estilos fuera del componente: referencias estables, cero trabajo al re-renderizar
const SEND_BUTTON_STYLE: ViewStyle = {
  width: ALTO_PILDORA,
  height: ALTO_PILDORA,
  borderRadius: ALTO_PILDORA / 2,
  backgroundColor: COLOR_MI_BURBUJA,
  alignItems: "center",
  justifyContent: "center",
  // La sombra suave de la burbuja, apenas más marcada por ser un botón
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 2,
};

/**
 * Botón de enviar: círculo del alto del input, con el fondo de la burbuja de mis mensajes.
 * Memoizado: no se re-renderiza al escribir ni al enviar, así ninguna actualización de React
 * interrumpe su animación al presionarlo.
 */
export const BotonEnviar = memo(function BotonEnviar({
  onPress,
  sending = false,
}: {
  onPress: () => void;
  /** Se están subiendo las fotos: en lugar del avión se muestra un indicador. */
  sending?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Enviar mensaje"
      onPress={onPress}
      scaleTo={0.9}
      style={SEND_BUTTON_STYLE}
    >
      {sending ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={{ transform: [{ translateX: 0.5 }] }}>
          <SendIcon size={30} color="#ffffff" />
        </View>
      )}
    </PressableScale>
  );
});
