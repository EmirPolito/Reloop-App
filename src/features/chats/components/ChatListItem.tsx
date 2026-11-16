import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import type { Chat } from "@/features/marketplace/types";
import { Text } from "@/features/shared/Text";
import { formatChatTime } from "@/utils/time";

const COLOR_PUNTO = "#1C77FF";
/** Punto de un chat ya leído: un gris casi blanco (neutral-100) */
const COLOR_PUNTO_LEIDO = "#ECECEE";
const LADO_AVATAR = 50;

/**
 * Tarjeta de una conversación en la lista de chats, con el mismo estilo que las de
 * notificaciones: el avatar de la otra persona (con su insignia si tiene Premium), su nombre
 * arriba, el último mensaje debajo y, a la derecha, la hora con un punto azul debajo (apagado
 * cuando ya se leyó).
 */
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
  const { lastMessage } = chat;
  const hora =
    lastMessage && lastMessage.time > 0 ? formatChatTime(lastMessage.time) : "";
  const resumen = lastMessage
    ? `${lastMessage.from === "me" ? "Tú: " : ""}${lastMessage.hasImages ? "📷 Foto" : lastMessage.text}`
    : "Comienza a chatear";

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`${chat.name}. ${resumen}${hora ? `, ${hora}` : ""}${chat.unread ? ", sin leer" : ""}`}
      onPress={() => onPress(chat.id)}
      style={styles.tarjeta}
    >
      <AvatarVendedor
        ownerId={chat.otherId}
        fallbackName={chat.name}
        size={LADO_AVATAR}
      />

      <View style={styles.textos}>
        <Text numberOfLines={1} style={styles.nombre}>
          {chat.name}
        </Text>
        <Text numberOfLines={1} style={styles.mensaje}>
          {resumen}
        </Text>
        {productName ? (
          <Text numberOfLines={1} style={styles.publicacion}>
            Publicación: {productName}
          </Text>
        ) : null}
      </View>

      <View style={styles.derecha}>
        <Text style={styles.hora}>{hora}</Text>
        <View
          style={[
            styles.punto,
            !chat.unread && { backgroundColor: COLOR_PUNTO_LEIDO },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
    </PressableSuave>
  );
});

const styles = StyleSheet.create({
  // Blanco liso, con borde fino y sombra suave porque el fondo de abajo es casi blanco
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: 22,
    marginBottom: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  textos: { flex: 1, minWidth: 0, gap: 3 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#101010" },
  mensaje: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: "#6B6B70",
  },
  publicacion: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: COLOR_PUNTO,
  },
  derecha: {
    alignItems: "flex-end",
    gap: 9,
    alignSelf: "stretch",
    paddingTop: 10,
    marginRight: 4,
  },
  hora: { fontFamily: "Inter_500Medium", fontSize: 11.5, color: "#8A8A8F" },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLOR_PUNTO,
  },
});
