import { renderPerfilIcon } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";
import { View } from "react-native";
import { type ColorPerfil, TEMAS } from "./temasPerfil";

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
  const fondo = isDark ? "#ffffff17" : tema.pillBg;
  const colorIcono = isDark ? "#E5E7EB" : "#6f6f6fff";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 21,
        backgroundColor: fondo,
        borderColor: tema.pillBorder,
        borderWidth: 1,
        paddingHorizontal: 6,
        borderRadius: 17,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 3 }}>
          {renderPerfilIcon(icon, 13.5, colorIcono)}
        </View>
      ) : null}
      <Text
        style={{
          top: 0,
          fontSize: 11.5,
          fontFamily: "Inter_500Medium",
          color: textColor,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
