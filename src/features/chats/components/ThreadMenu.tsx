import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT } from "@/constants/motion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showAlert } from "@/utils/alerts";
import { CallIcon, VideoIcon } from "./ThreadIcons";

function MenuItem({
  icon,
  label,
  color,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.97}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 12,
      }}
      onPress={onPress}
    >
      {icon}
      <Text
        style={{
          top: 2.5,
          marginLeft: 13,
          fontSize: 14.5,
          fontWeight: "500",
          color,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

/** Menú flotante del chat (llamadas y videollamadas, aún no disponibles). */
export function ThreadMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const ink = isDark ? "#F1F5F9" : "#101010";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "#00000028",
          justifyContent: "flex-start",
          alignItems: "flex-end",
          paddingTop: insets.top + 68,
          paddingRight: 15,
        }}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeInUp.duration(150).easing(EASE_OUT)}
          style={{
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 5,
            width: 170,
          }}
        >
          <MenuItem
            icon={<CallIcon size={22.5} color={ink} />}
            label="Llamar"
            color={ink}
            onPress={() => {
              onClose();
              showAlert(
                "Llamadas",
                "Las llamadas todavía no están disponibles.",
              );
            }}
          />

          {/* Línea divisora */}
          <View
            style={{
              height: 1,
              backgroundColor: isDark ? "#334155" : "#f5f5f5ff",
              marginHorizontal: 0,
            }}
          />

          <MenuItem
            icon={<VideoIcon size={22.5} color={ink} />}
            label="Videollamar"
            color={ink}
            onPress={() => {
              onClose();
              showAlert(
                "Videollamadas",
                "Las videollamadas todavía no están disponibles.",
              );
            }}
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
