import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Disolvible, type Disolvedor } from "@/components/ui/Disolvible";
import { TextoSobreRojo } from "@/components/ui/SwipeParaEliminar";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import { categoryFor } from "@/features/marketplace/data";
import type { CategoryId, Chat } from "@/features/marketplace/types";
import { renderPerfilIcon } from "@/features/perfil/Perfiliconos";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { formatChatTime } from "@/utils/time";

const COLOR_AZUL = "#1C77FF";
const LADO_AVATAR = 58;
const LADO_CHECK = 26;
const GAP = 12;
const PADDING = 12;
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
  onLongPress,
  seleccionando = false,
  marcado = false,
  registrar,
}: {
  chat: Chat;
  /** Categoría de la publicación de la que parte el chat, si la hay */
  categoria?: CategoryId;
  /** Cuántos mensajes sin leer tiene (0 si está leído) */
  sinLeer: number;
  onPress: (chatId: string) => void;
  /** Toque largo: empieza a seleccionar para eliminar */
  onLongPress?: (chatId: string) => void;
  /** Modo de selección: el toque marca o desmarca el chat */
  seleccionando?: boolean;
  marcado?: boolean;
  /** La pantalla guarda cómo disolver este chat al eliminarlo (efecto Stream) */
  registrar?: (id: string, disolvedor: Disolvedor | null) => void;
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
    // El relleno incluye lo que sobresale de la fila (la insignia) en la captura del efecto
    <Disolvible id={chat.id} registrar={registrar} sombra={10}>
      <PressableSuave
        accessibilityRole="button"
        accessibilityLabel={`${chat.name}. ${resumen}${hora ? `, ${hora}` : ""}${chat.unread ? `, ${conteo} sin leer` : ""}${categoria ? `, publicación de ${categoryFor(categoria).label}` : ""}`}
        accessibilityState={seleccionando ? { selected: marcado } : undefined}
        onPress={() => onPress(chat.id)}
        onLongPress={onLongPress ? () => onLongPress(chat.id) : undefined}
        style={styles.fila}
      >
        {seleccionando ? (
          <View
            style={[
              styles.check,
              marcado
                ? { backgroundColor: COLOR_AZUL, borderColor: COLOR_AZUL }
                : { borderColor: isDark ? "#64748B" : "#C4C4CA" },
            ]}
          >
            {marcado ? (
              <Ionicons name="checkmark" size={17} color="#FFFFFF" />
            ) : null}
          </View>
        ) : null}
        <AvatarVendedor
          ownerId={chat.otherId}
          fallbackName={chat.name}
          size={LADO_AVATAR}
          // Insignia un poco más chica, más abajo y hacia la izquierda
          ajusteInsignia={{ escala: 0.5, right: 1, bottom: -8 }}
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
          {/* Al deslizar para eliminar, el gris se aclara un poco sobre el rojo */}
          <TextoSobreRojo
            numberOfLines={1}
            colorBase={isDark ? "#94A3B8" : "#6B6B70"}
            style={styles.mensaje}
          >
            {resumen}
          </TextoSobreRojo>
        </View>

        <View style={styles.derecha}>
          <TextoSobreRojo
            colorBase={isDark ? "#94A3B8" : "#8A8A8F"}
            style={styles.hora}
          >
            {hora}
          </TextoSobreRojo>
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

        {/* Línea suave debajo: empieza donde empiezan el nombre y el mensaje, no en el avatar */}
        <View
          pointerEvents="none"
          style={[
            styles.linea,
            {
              left:
                PADDING +
                (seleccionando ? LADO_CHECK + GAP : 0) +
                LADO_AVATAR +
                GAP,
              backgroundColor: isDark ? "#ffffff24" : "rgba(0,0,0,0.11)",
            },
          ]}
        />
      </PressableSuave>
    </Disolvible>
  );
});

const styles = StyleSheet.create({
  // Suelta, sin tarjeta, con una línea suave debajo
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
    paddingVertical: 16,
    paddingHorizontal: PADDING,
  },
  check: {
    width: LADO_CHECK,
    height: LADO_CHECK,
    borderRadius: LADO_CHECK / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Desde el nombre y el mensaje hasta casi el borde derecho
  linea: {
    position: "absolute",
    bottom: 5,
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
    fontSize: 14.5,
    lineHeight: 20,
  },
  derecha: { alignItems: "flex-end", gap: 7, minWidth: LADO_CIRCULO },
  hora: { fontFamily: "Inter_400Regular", fontSize: 14.5 },
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
