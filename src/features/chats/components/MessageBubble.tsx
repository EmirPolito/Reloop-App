import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { EASE_OUT } from "@/constants/motion";
import type { ChatMessage } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { formatMessageTime } from "@/utils/time";

const BUBBLE_ENTERING = FadeInDown.duration(160).easing(EASE_OUT);

const IMAGE_GAP = 4;
const MAX_VISIBLE_IMAGES = 4;
const NO_IMAGES: string[] = [];
/** Ancho al que se piden las miniaturas a Cloudinary (el visor abre la foto completa). */
const THUMBNAIL_WIDTH = 400;

function thumbnail(uri: string): string {
  return optimizedImageUrl(uri, THUMBNAIL_WIDTH) ?? uri;
}

/** Fotos de un mensaje: una sola grande o una cuadrícula de hasta cuatro con contador "+N". */
function MessageImages({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (images: string[], initialIndex: number) => void;
}) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Pressable
        onPress={() => onOpen(images, 0)}
        style={{ alignSelf: "flex-end" }}
      >
        <Image
          source={{ uri: thumbnail(images[0]) }}
          contentFit="cover"
          style={{
            width: 170,
            height: 170,
            borderRadius: 18,
            borderColor: "#ffffffff",
            borderWidth: 2,
          }}
        />
      </Pressable>
    );
  }

  const imageSize = 108;
  const visibleImages = images.slice(0, MAX_VISIBLE_IMAGES);
  const remaining = images.length - MAX_VISIBLE_IMAGES;

  return (
    <View
      style={{
        alignSelf: "flex-end",
        width: imageSize * 2 + IMAGE_GAP,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: IMAGE_GAP,
      }}
    >
      {visibleImages.map((uri, index) => {
        const isLastItem = index === MAX_VISIBLE_IMAGES - 1 && remaining > 0;

        return (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => onOpen(images, index)}
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: thumbnail(uri) }}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
            />

            {isLastItem ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "700" }}
                >
                  +{remaining}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// Burbuja memoizada: al escribir o enviar solo se renderiza la burbuja nueva,
// no todo el historial (clave para que el envío se sienta fluido).
export const MessageBubble = memo(function MessageBubble({
  message,
  isNew,
  onOpenImages,
}: {
  message: ChatMessage;
  /** Solo los mensajes nuevos se animan; el historial aparece sin movimiento. */
  isNew: boolean;
  onOpenImages: (images: string[], initialIndex: number) => void;
}) {
  const { isDark, styles } = useAppTheme();
  const isMe = message.from === "me";
  const images = message.images ?? NO_IMAGES;
  const hasImages = images.length > 0;
  const hasText = message.text.trim().length > 0;

  return (
    <Animated.View
      entering={isNew ? BUBBLE_ENTERING : undefined}
      style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        {
          maxWidth: "78%",
          paddingHorizontal: hasImages && !hasText ? 0 : 15,
          paddingVertical: hasImages && !hasText ? 0 : 8,
          borderRadius: 13,
          marginVertical: 3.5,
          alignSelf: isMe ? "flex-end" : "flex-start",
          ...(hasImages && !hasText
            ? {
                backgroundColor: "transparent",
                borderWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                shadowRadius: 0,
              }
            : isMe
              ? {
                  backgroundColor: "#4fa1ffff",
                  borderBottomRightRadius: 3.5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : {
                  backgroundColor: isDark ? "#2A2B32" : "#FFFFFF",
                  borderBottomLeftRadius: 4,
                  borderWidth: 1,
                  borderColor: isDark ? "#3A3B42" : "#EAEAEA",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1,
                }),
        },
      ]}
    >
      <MessageImages images={images} onOpen={onOpenImages} />

      {hasText ? (
        <Text
          style={[
            styles.messageText,
            {
              left: 3,
              fontSize: 13.5,
              lineHeight: 20,
              paddingBottom: 1,
              fontWeight: "400",
              marginTop: hasImages ? 6 : 0,
              paddingHorizontal: hasImages ? 4 : 0,
              color: isMe ? "#FFFFFF" : isDark ? "#F3F4F6" : "#1F2937",
            },
            isMe && styles.myMessageText,
          ]}
        >
          {message.text}
        </Text>
      ) : null}

      <View
        style={[
          styles.messageMeta,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: 3,
            left: 1,
            gap: 0,
            paddingHorizontal: 0,
            paddingVertical: 0,
            alignSelf: "flex-end",
          },
        ]}
      >
        <Text
          style={[
            styles.messageTime,
            !isMe && styles.receivedMessageTime,
            {
              fontSize: 11.5,
              top: 1,
              fontWeight: "400",
              color:
                hasImages && !hasText
                  ? isDark
                    ? "#E5E7EB"
                    : "#212121ff"
                  : isMe
                    ? "rgba(255, 255, 255, 0.75)"
                    : "#9CA3AF",
            },
          ]}
        >
          {formatMessageTime(message.time)}
        </Text>
      </View>
    </Animated.View>
  );
});
