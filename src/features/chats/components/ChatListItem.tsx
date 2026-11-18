import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId, Chat } from "@/features/marketplace/types";
import { renderPerfilIcon } from "@/features/perfil/Perfiliconos";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { formatChatTime } from "@/utils/time";

const COLOR_AZUL = "#1C77FF";
const LADO_AVATAR = 50;
/** Círculo del contador: lo bastante grande para que quepa "+9" */
const LADO_CIRCULO = 24;
/** Con más mensajes que esto el contador dice "+9" */
const MAX_VISIBLE = 9;

/**
 * Una conversación en la lista de chats, suelta sobre el fondo: el avatar de la otra persona
 * (con su insignia si tiene Premium), su nombre arriba y el último mensaje debajo. A la
 * derecha, la hora o fecha y debajo:
 * - un círculo azul con cuántos mensajes sin leer hay ("+9" si son más de nueve);
 * - una palomita si yo envié el último mensaje (dos y azules si la otra persona ya lo vio);
 * - nada si no hay mensajes sin leer.
 * Si el chat parte de una publicación, su categoría va entre paréntesis junto al nombre, en
 * una píldora gris con un icono de calendario. Una línea fina y suave separa cada chat del siguiente.
 */
export const ChatListItem = memo(function ChatListItem({
  chat,
  categoria,
  sinLeer,
  onPress,
}: {
  chat: Chat;
  /** Categoría de la publicación de la que parte el chat, si la hay */
  categoria?: CategoryId;
  /** Cuántos mensajes sin leer tiene (0 si está leído) */
  sinLeer: number;
  onPress: (chatId: string) => void;
}) {
  const { isDark } = useAppTheme();
  const { lastMessage } = chat;
  const hora =
    lastMessage && lastMessage.time > 0 ? formatChatTime(lastMessage.time) : "";
  const resumen = lastMessage
    ? `${lastMessage.from === "me" ? "Tú: " : ""}${lastMessage.hasImages ? "📷 Foto" : lastMessage.text}`
    : "Comienza a chatear";

  const esMio = lastMessage?.from === "me";
  const visto = esMio && chat.otherReadAt >= (lastMessage?.time ?? 0);
  const conteo = Math.max(sinLeer, chat.unread ? 1 : 0);
  // Un gris más fuerte que el de la píldora: el icono y el texto se leen sin gritar
  const colorCategoria = isDark ? "#CBD5E1" : "#6B6B72";

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`${chat.name}. ${resumen}${hora ? `, ${hora}` : ""}${chat.unread ? `, ${conteo} sin leer` : ""}${categoria ? `, publicación de ${categoryFor(categoria).label}` : ""}`}
      onPress={() => onPress(chat.id)}
      style={styles.fila}
    >
      <AvatarVendedor
        ownerId={chat.otherId}
        fallbackName={chat.name}
        size={LADO_AVATAR}
      />

      <View style={styles.textos}>
        <View style={styles.filaNombre}>
          <Text
            numberOfLines={1}
            style={[styles.nombre, { color: isDark ? "#F1F5F9" : "#101010" }]}
          >
            {chat.name}
          </Text>
          {categoria ? (
            // Etiqueta de la categoría de la publicación: píldora gris con calendario y nombre
            <View
              accessible
              accessibilityLabel={`Categoría ${categoryFor(categoria).label}`}
              style={[
                styles.categoria,
                { backgroundColor: isDark ? "#ffffff14" : "#F1F1F3" },
              ]}
            >
              {renderPerfilIcon("calendar", 12, colorCategoria)}
              <Text
                numberOfLines={1}
                style={[styles.categoriaTexto, { color: colorCategoria }]}
              >
                {categoryFor(categoria).label}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.mensaje, { color: isDark ? "#94A3B8" : "#6B6B70" }]}
        >
          {resumen}
        </Text>
      </View>

      <View style={styles.derecha}>
        <Text style={[styles.hora, { color: isDark ? "#94A3B8" : "#8A8A8F" }]}>
          {hora}
        </Text>
        {esMio ? (
          <Ionicons
            name={visto ? "checkmark-done" : "checkmark"}
            size={20}
            color={visto ? COLOR_AZUL : isDark ? "#94A3B8" : "#9AA0AB"}
            style={styles.palomita}
          />
        ) : chat.unread ? (
          <View
            style={[styles.circulo, { backgroundColor: COLOR_AZUL }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={styles.cuenta}>
              {conteo > MAX_VISIBLE ? "+9" : conteo}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Línea suave debajo: pasa también por debajo del avatar y deja libre el borde de los lados */}
      <View
        pointerEvents="none"
        style={[
          styles.linea,
          { backgroundColor: isDark ? "#ffffff24" : "rgba(0,0,0,0.11)" },
        ]}
      />
    </PressableSuave>
  );
});

const styles = StyleSheet.create({
  // Suelta, sin tarjeta, con una línea suave debajo
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  // Cubre también el avatar: desde el margen izquierdo hasta casi el borde derecho
  linea: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 18,
    height: StyleSheet.hairlineWidth,
  },
  textos: { flex: 1, minWidth: 0, gap: 3 },
  nombre: { flexShrink: 1, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  filaNombre: { flexDirection: "row", alignItems: "center", gap: 7 },
  categoria: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 21,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  categoriaTexto: { fontFamily: "Inter_500Medium", fontSize: 11 },
  mensaje: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  derecha: { alignItems: "flex-end", gap: 7, minWidth: LADO_CIRCULO },
  hora: { fontFamily: "Inter_500Medium", fontSize: 11.5 },
  circulo: {
    minWidth: LADO_CIRCULO,
    height: LADO_CIRCULO,
    borderRadius: LADO_CIRCULO / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cuenta: { fontFamily: "Inter_600SemiBold", fontSize: 11.5, color: "#FFFFFF" },
  // La palomita ocupa el lugar del círculo
  palomita: { height: LADO_CIRCULO, lineHeight: LADO_CIRCULO },
});
