import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
} from "react-native-reanimated";

import {
  BotonEliminarBurbuja,
  ESPACIO_BOTON_BURBUJA,
  TapaRoja,
  useAperturaBurbuja,
} from "@/components/ui/DeslizarConBoton";
import { EASE_OUT } from "@/constants/motion";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import type { ChatMessage } from "@/features/marketplace/types";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { PedidoChat } from "@/features/pedidos/components/PedidoChat";
import { SolicitudChat } from "@/features/resenas/components/SolicitudChat";
import { TarjetaChat } from "@/features/tarjetas/components/TarjetaChat";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { formatMessageTime } from "@/utils/time";

const BUBBLE_ENTERING = FadeInDown.duration(160).easing(EASE_OUT);

/** Avatar de quien escribe, a la izquierda de sus burbujas, y su separación con ellas */
const LADO_AVATAR = 34;
const SEPARACION_AVATAR = 8;

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
export const BurbujaMensaje = memo(function BurbujaMensaje({
  message,
  contactId,
  contactName,
  showAvatar,
  isNew,
  onOpenImages,
}: {
  message: ChatMessage;
  /** Quien escribe los mensajes recibidos (su avatar va a la izquierda de la burbuja) */
  contactId: string;
  contactName: string;
  /** Primer mensaje de una racha de la otra persona: lleva el avatar; los siguientes, solo el hueco */
  showAvatar: boolean;
  /** Solo los mensajes nuevos se animan; el historial aparece sin movimiento. */
  isNew: boolean;
  onOpenImages: (images: string[], initialIndex: number) => void;
}) {
  const { isDark, styles } = useAppTheme();
  const isMe = message.from === "me";
  const images = message.images ?? NO_IMAGES;
  const hasImages = images.length > 0;
  const hasText = message.text.trim().length > 0;

  const hora = formatMessageTime(message.time);
  const entrada = isMe && isNew ? BUBBLE_ENTERING : undefined;
  const soloFotos = hasImages && !hasText;
  const esEspecial = Boolean(
    message.tarjeta || message.pedido || message.calificacion,
  );
  // Al deslizarla para eliminar, la burbuja se alarga a la derecha: ahí va su botón
  const apertura = useAperturaBurbuja();
  const rellenoDerecho = esEspecial || soloFotos ? 0 : 16;
  const estiloApertura = useAnimatedStyle(() =>
    apertura
      ? { paddingRight: rellenoDerecho + apertura.get() * ESPACIO_BOTON_BURBUJA }
      : {},
  );
  // Una tarjeta para transferir, un pedido o una solicitud de calificación van solos, sin burbuja
  const especial = message.tarjeta ? (
    <TarjetaChat tarjeta={message.tarjeta} hora={hora} mia={isMe} />
  ) : message.pedido ? (
    <PedidoChat pedido={message.pedido} hora={hora} mia={isMe} />
  ) : message.calificacion ? (
    <SolicitudChat solicitud={message.calificacion} hora={hora} />
  ) : null;
  const burbuja = especial ? (
    // Recortada en redondo: el rojo de eliminar no se sale de su forma (ver la burbuja normal)
    <Animated.View
      entering={entrada}
      style={[{ borderRadius: 18, overflow: "hidden" }, estiloApertura]}
    >
      {especial}
      <BotonEliminarBurbuja />
      {/* Al eliminarla se cubre toda de rojo y luego se vuelve polvo */}
      <TapaRoja />
    </Animated.View>
  ) : (
    <Animated.View
      entering={isMe && isNew ? BUBBLE_ENTERING : undefined}
      style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        {
          maxWidth: isMe ? "78%" : undefined,
          flexShrink: 1,
          // Un poco más de aire dentro y entre una burbuja y otra
          paddingHorizontal: hasImages && !hasText ? 0 : 16,
          paddingVertical: hasImages && !hasText ? 0 : 10,
          borderRadius: 13,
          marginVertical: 5,
          alignSelf: isMe ? "flex-end" : "auto",
          // Recorta lo de adentro con su forma: el rojo de eliminar es un rectángulo y la
          // burbuja le da las esquinas. Con esquinas propias, al angostarse (al cerrarse) iOS
          // las achicaba y asomaba un pedazo de rojo fuera de la burbuja
          overflow: "hidden",
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
                  backgroundColor: "#272727ff",
                  borderBottomRightRadius: 3.5,
                }
              : {
                  // Sin sombra: era casi invisible y, al subir la lista con el teclado, recalcular
                  // la sombra de cada burbuja en cada cuadro se sentía como lag
                  backgroundColor: isDark ? "#2A2B32" : "#FFFFFF",
                }),
        },
        estiloApertura,
      ]}
    >
      <MessageImages images={images} onOpen={onOpenImages} />

      {hasText ? (
        <Text
          style={[
            styles.messageText,
            {
              left: 3,
              fontSize: 14.5,
              lineHeight: 20.5,
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
      <BotonEliminarBurbuja />
      {/* Al eliminarla se cubre toda de rojo, con su misma forma, y luego se vuelve polvo */}
      <TapaRoja />
    </Animated.View>
  );

  // Los míos, como siempre: pegados a la derecha
  if (isMe) return burbuja;

  // Los recibidos: el avatar a la izquierda de la burbuja (solo en el primero de la racha) y
  // los siguientes alineados debajo, con el mismo hueco
  return (
    <Animated.View
      entering={isNew ? BUBBLE_ENTERING : undefined}
      style={{
        flexDirection: "row",
        // El avatar queda arriba, a la altura de la primera línea de la burbuja
        alignItems: "flex-start",
        alignSelf: "flex-start",
        maxWidth: "88%",
        gap: SEPARACION_AVATAR,
      }}
    >
      <View style={{ width: LADO_AVATAR, height: LADO_AVATAR, marginTop: 3 }}>
        {showAvatar ? (
          <AvatarVendedor
            ownerId={contactId}
            fallbackName={contactName}
            size={LADO_AVATAR}
          />
        ) : null}
      </View>
      {burbuja}
    </Animated.View>
  );
});
