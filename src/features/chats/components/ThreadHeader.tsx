import { View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { Avatar } from "@/components/ui/Avatar";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { BackArrowIcon, CategoryIcon } from "./ThreadIcons";

function roundButtonStyle(isDark: boolean) {
  return {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: isDark ? "#ffffff1a" : "#ffffff8b",
    borderWidth: 2,
    borderColor: isDark ? "#ffffff33" : "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5.5,
  } as const;
}

/** Encabezado flotante del chat: volver, contacto (abre su perfil) y menú. */
export function ThreadHeader({
  contactName,
  onBack,
  onOpenProfile,
  onOpenMenu,
}: {
  contactName: string;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
}) {
  const { isDark, styles } = useAppTheme();
  const buttonStyle = roundButtonStyle(isDark);

  return (
    <View
      style={[
        styles.threadHeader,
        {
          position: "absolute",
          left: 0,
          right: 0,
          borderWidth: 0,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          borderColor: "transparent",
          elevation: 0,
          paddingHorizontal: 15,
          paddingTop: 0,
          paddingBottom: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        },
      ]}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Volver a los chats"
        onPress={onBack}
        scaleTo={0.92}
        style={buttonStyle}
      >
        <View style={{ transform: [{ translateX: -1.5 }] }}>
          <BackArrowIcon size={26} color={isDark ? "#FFFFFF" : "#101010"} />
        </View>
      </PressableScale>

      {/* Con esto se sube el header completo */}
      <View
        style={{
          alignItems: "center",
          flex: 1,
          marginHorizontal: 10,
          marginTop: 20,
          bottom: 0.5,
        }}
      >
        <Avatar name={contactName} size={45} />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${contactName}`}
          onPress={onOpenProfile}
          scaleTo={0.96}
          style={{ marginTop: 1 }}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.threadContactName,
              { textAlign: "center", fontWeight: "500", fontSize: 12.5 },
            ]}
          >
            {contactName}
          </Text>
        </PressableScale>
      </View>

      {/* Botón derecho de cuadros */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Más opciones"
        onPress={onOpenMenu}
        scaleTo={0.92}
        style={buttonStyle}
      >
        <View style={{ transform: [{ translateY: -0.5 }] }}>
          <CategoryIcon size={22} color={isDark ? "#FFFFFF" : "#101010"} />
        </View>
      </PressableScale>
    </View>
  );
}
