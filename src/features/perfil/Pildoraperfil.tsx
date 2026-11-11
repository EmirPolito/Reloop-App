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
  const textColor = isDark ? "#E5E7EB" : "#757575ff";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 21,
        backgroundColor: tema.pillBg,
        borderColor: tema.pillBorder,
        borderWidth: 1,
        paddingHorizontal: 5.5,
        borderRadius: 17,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 3.5 }}>
          {/* El icono toma el color de la píldora */}
          {renderPerfilIcon(icon, 13.5, tema.accent)}
        </View>
      ) : null}
      <Text
        style={{
          top: 0,
          fontSize: 10.5,
          fontWeight: "500",
          color: textColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
