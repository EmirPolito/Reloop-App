import { memo } from "react";
import { Pressable, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import type { Chat } from "@/features/marketplace/types";
import { formatChatTime } from "@/utils/time";

const AVATAR_STYLE = { backgroundColor: "#dbeafe" } as const;
const AVATAR_STYLE_DARK = { backgroundColor: "#1E293B" } as const;
const AVATAR_TEXT_STYLE = {
  fontSize: 17,
  fontWeight: "700",
  color: "#1d4ed8",
} as const;
const AVATAR_TEXT_STYLE_DARK = { ...AVATAR_TEXT_STYLE, color: "#93C5FD" } as const;

/** Resumen de una conversación en la lista de chats. */
export const ChatListItem = memo(function ChatListItem({
  chat,
  productName,
  onPress,
}: {
  chat: Chat;
  /** Nombre de la publicación relacionada, si la hay. */
  productName?: string;
  onPress: (chatId: string) => void;
}) {
  const { isDark } = useAppTheme();
  const { lastMessage } = chat;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(chat.id)}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 0,
          borderRadius: 16,
          backgroundColor: pressed ? "#ca98980a" : "transparent",
        },
      ]}
    >
      <Avatar
        name={chat.name}
        size={50}
        style={isDark ? AVATAR_STYLE_DARK : AVATAR_STYLE}
        textStyle={isDark ? AVATAR_TEXT_STYLE_DARK : AVATAR_TEXT_STYLE}
      />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 0,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: isDark ? "#ffffff" : "#111827",
              flex: 1,
            }}
          >
            {chat.name}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94A3B8" : "#6b7280",
              marginLeft: 8,
            }}
          >
            {lastMessage && lastMessage.time > 0
              ? formatChatTime(lastMessage.time)
              : ""}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            color: isDark ? "#9ca3af" : "#4b5563",
            lineHeight: 18,
          }}
        >
          {lastMessage
            ? `${lastMessage.from === "me" ? "Tú: " : ""}${lastMessage.hasImages ? "📷 Foto" : lastMessage.text}`
            : "Comienza a chatear"}
        </Text>

        {productName ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: isDark ? "#60A5FA" : "#2563eb",
              fontWeight: "500",
              marginTop: 3,
            }}
          >
            Publicación: {productName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});
