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
  const textColor = isDark ? "#E5E7EB" : "#6f6f6fff";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 23,
        backgroundColor: tema.pillBg,
        borderColor: tema.pillBorder,
        borderWidth: 1,
        paddingHorizontal: 6.5,
        borderRadius: 17,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 3.5 }}>
          {renderPerfilIcon(icon, 15, "#6f6f6fff")}
        </View>
      ) : null}
      <Text
        style={{
          top: 0,
          fontSize: 12.5,
          fontFamily: "Inter_500Medium",
          color: textColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
