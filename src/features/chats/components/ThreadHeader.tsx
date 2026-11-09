import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { Avatar } from "@/components/ui/Avatar";
import {
  THREAD_HEADER_CONTENT_HEIGHT,
  THREAD_HEADER_Z,
} from "@/features/chats/threadLayout";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { BackArrowIcon, CategoryIcon } from "./ThreadIcons";

function roundButtonStyle(isDark: boolean) {
  return {
    width: 45,
    height: 45,
    borderRadius: 30,
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderWidth: 2,
    borderColor: isDark ? "#ffffff33" : "#ffffffff",
    alignItems: "center",
    justifyContent: "center",
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
  const insets = useSafeAreaInsets();
  const buttonStyle = roundButtonStyle(isDark);
  const iconColor = isDark ? "#FFFFFF" : "#101010";
  const isIOS = Platform.OS === "ios";

  // iOS: el blur hace el vidrio, el tinte es suave.
  // Android: sin blur real, el tinte es más fuerte para que se lea bien.
  const tint = isIOS
    ? isDark
      ? "#1E293B66"
      : "#ffffff40"
    : isDark
      ? "#1E293Bcc"
      : "#f6f6f6ae";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.threadHeader,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: THREAD_HEADER_Z,
          elevation: THREAD_HEADER_Z,
          shadowColor: "transparent",
          height: insets.top + THREAD_HEADER_CONTENT_HEIGHT,
          paddingTop: insets.top,
          paddingHorizontal: 15,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          backgroundColor: tint,
          borderWidth: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "#ffffff22" : "#f6f6f644",
        },
      ]}
    >
      {isIOS && (
        <BlurView
          intensity={isDark ? 40 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Volver a los chats"
        onPress={onBack}
        scaleTo={0.92}
        style={buttonStyle}
      >
        <View style={{ transform: [{ translateX: -1.5 }] }}>
          <BackArrowIcon size={26} color={iconColor} />
        </View>
      </PressableScale>

      {/* Centro: avatar (abre el perfil) + nombre del contacto debajo */}
      <View style={{ alignItems: "center", flex: 1, marginHorizontal: 10 }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${contactName}`}
          onPress={onOpenProfile}
          scaleTo={0.94}
        >
          <Avatar name={contactName} size={45} />
        </PressableScale>

        <Text
          numberOfLines={1}
          style={[
            styles.threadContactName,
            {
              textAlign: "center",
              fontWeight: "500",
              fontSize: 12.5,
              marginTop: 3,
            },
          ]}
        >
          {contactName}
        </Text>
      </View>

      {/* Botón derecho de menú */}
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Más opciones"
        onPress={onOpenMenu}
        scaleTo={0.92}
        style={buttonStyle}
      >
        <View style={{ transform: [{ translateY: -0.5 }] }}>
          <CategoryIcon size={22} color={iconColor} />
        </View>
      </PressableScale>
    </View>
  );
}
