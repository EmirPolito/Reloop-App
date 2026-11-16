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
  const bgColor = isDark ? tema.pillBgDark : tema.pillBg;
  const contentColor = isDark ? tema.pillColorDark : tema.pillColor;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 22,
        backgroundColor: bgColor,
        paddingHorizontal: 7,
        borderRadius: 17,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 3.5 }}>
          {renderPerfilIcon(icon, 14, contentColor)}
        </View>
      ) : null}
      <Text
        style={{
          top: 0,
          fontSize: 11.5,
          fontFamily: "Inter_500Medium",
          color: contentColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
