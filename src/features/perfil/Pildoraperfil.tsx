import { renderPerfilIcon } from "@/features/perfil/Perfiliconos";
import { Text } from "@/features/shared/Text";
import { View } from "react-native";
import { type ColorPerfil, TEMAS } from "./Perfiltemas";

export function PildoraPerfil({
  text,
  color,
  isDark,
  icon,
}: {
  text: string;
  color: ColorPerfil;
  isDark?: boolean;
  icon?: string;
}) {
  const tema = TEMAS[color] ?? TEMAS.azul;
  const textColor = isDark ? "#E5E7EB" : "#4d4d4dff";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 22,
        backgroundColor: tema.pillBg,
        borderColor: tema.pillBorder,
        borderWidth: 1,
        paddingHorizontal: 5.7,
        borderRadius: 15,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 3.5 }}>
          {/* El icono toma el color de la píldora */}
          {renderPerfilIcon(icon, 13, tema.accent)}
        </View>
      ) : null}
      <Text
        style={{
          top: 1,
          fontSize: 11,
          fontWeight: "500",
          color: textColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
