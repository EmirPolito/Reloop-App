import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { ActivityIndicator, View, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { estiloBotonTema } from "@/features/perfil/Perfiltemas";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { SendIcon } from "./ThreadIcons";

// Estilos fuera del componente: referencias estables, cero trabajo al re-renderizar
const SEND_BUTTON_STYLE: ViewStyle = {
  width: 50.5,
  height: 50.5,
  marginRight: 5.5,
  opacity: 1, // Siempre con opacidad completa
};

const SEND_GRADIENT_STYLE: ViewStyle = {
  width: "100%",
  height: "100%",
  borderRadius: 25.25,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 0.3,
  borderColor: "#7ebaffff",
  shadowColor: "#2563EB",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 3,
  overflow: "hidden",
};

const SEND_GLOSS_STYLE: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 2,
  right: 2,
  height: 24,
  borderTopLeftRadius: 23,
  borderTopRightRadius: 23,
  borderBottomLeftRadius: 15,
  borderBottomRightRadius: 15,
};

// Memoizado: no se re-renderiza al escribir ni al enviar, así ninguna
// actualización de React puede interrumpir la animación del botón.
export const SendButton = memo(function SendButton({
  onPress,
  sending = false,
}: {
  onPress: () => void;
  /** Se están subiendo las fotos: en lugar del avión se muestra un indicador. */
  sending?: boolean;
}) {
  const { themeColor } = useAppTheme();
  const botonTema = estiloBotonTema(themeColor);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Enviar mensaje"
      onPress={onPress}
      scaleTo={0.92}
      style={SEND_BUTTON_STYLE}
    >
      <LinearGradient
        colors={botonTema.colors}
        locations={[0, 0.54, 1]}
        style={[
          SEND_GRADIENT_STYLE,
          {
            borderColor: botonTema.borderColor,
            shadowColor: botonTema.shadowColor,
          },
        ]}
      >
        {/* Reflejo superior en cúpula (Glossy Dome) */}
        <LinearGradient
          colors={["#ffffff73", "#ffffff0d"]}
          style={SEND_GLOSS_STYLE}
        />

        {sending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={{ transform: [{ translateX: 0.5 }] }}>
            <SendIcon size={32} color="#ffffff" />
          </View>
        )}
      </LinearGradient>
    </PressableScale>
  );
});
