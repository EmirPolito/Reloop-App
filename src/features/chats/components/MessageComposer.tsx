import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import {
  ALTO_PILDORA,
  PildoraCristal,
} from "@/features/busqueda/components/PildoraCristal";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { TextInput } from "@/features/shared/Text";
import { SendButton } from "./SendButton";
import { CloseXIcon } from "./ThreadIcons";

// Miniaturas seleccionadas sobre el input: entrada lenta y suave
const SOFT_EASE = Easing.out(Easing.cubic);
const PREVIEW_CONTAINER_IN = FadeInDown.delay(120)
  .duration(420)
  .easing(SOFT_EASE);
const PREVIEW_CONTAINER_OUT = FadeOutDown.duration(240);
const PREVIEW_ITEM_OUT = FadeOut.duration(220);
const PREVIEW_LAYOUT = LinearTransition.duration(320).easing(SOFT_EASE);

/** Lado del botón de adjuntar, dentro de la píldora del input */
const LADO_ADJUNTAR = 40;
/** La píldora del input: el alto del buscador, con el botón de adjuntar a la izquierda */
const ESTILO_INPUT = {
  height: ALTO_PILDORA,
  minHeight: ALTO_PILDORA,
  paddingLeft: (ALTO_PILDORA - 2 - LADO_ADJUNTAR) / 2,
  paddingRight: 14,
  paddingVertical: 0,
} as const;

/** Cuánto sube de más el composer cuando el teclado está abierto (px) */
const HUECO_SOBRE_TECLADO = 8;

/** Claves estables para las miniaturas (así la salida y el reacomodo animan la correcta). */
function usePreviewKeys(images: string[]): string[] {
  return useMemo(() => {
    const seen: Record<string, number> = {};
    return images.map((uri) => {
      seen[uri] = (seen[uri] ?? 0) + 1;
      return `${uri}#${seen[uri]}`;
    });
  }, [images]);
}

/** Zona inferior del chat: fotos por enviar, campo de texto, adjuntar y enviar. */
export function MessageComposer({
  draft,
  onChangeDraft,
  onSubmit,
  onSendPress,
  sending,
  images,
  onPickImages,
  onRemoveImage,
  onOpenImage,
}: {
  draft: string;
  onChangeDraft: (text: string) => void;
  /** Tecla "enviar" del teclado. */
  onSubmit: () => void;
  /** Botón de enviar: debe ser estable para no interrumpir su animación. */
  onSendPress: () => void;
  /** Las fotos se están subiendo: el botón muestra un indicador. */
  sending: boolean;
  images: string[];
  onPickImages: () => void;
  onRemoveImage: (index: number) => void;
  onOpenImage: (images: string[], index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { isDark, styles } = useAppTheme();
  const previewKeys = usePreviewKeys(images);
  // Sube el composer sobre el teclado (iOS y Android edge-to-edge); sin teclado no se mueve
  const keyboard = useAnimatedKeyboard();
  const bottomInset = insets.bottom;
  const liftStyle = useAnimatedStyle(() => ({
    transform: [
      {
        // Con el teclado abierto queda un poco más arriba de él (el hueco aparece junto con el teclado)
        translateY:
          -Math.max(keyboard.height.get() - bottomInset, 0) -
          Math.min(keyboard.height.get() / 40, 1) * HUECO_SOBRE_TECLADO,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 5,
          paddingHorizontal: 12,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 2,
        },
        liftStyle,
      ]}
    >
      {/* Previsualizador horizontal de imágenes seleccionadas (aparición suave) */}
      {images.length > 0 && (
        <Animated.ScrollView
          entering={PREVIEW_CONTAINER_IN}
          exiting={PREVIEW_CONTAINER_OUT}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ overflow: "visible" }}
          contentContainerStyle={{
            gap: 9,
            paddingHorizontal: 0,
            paddingTop: 5,
            paddingBottom: 10,
          }}
        >
          {images.map((uri, index) => (
            <Animated.View
              key={previewKeys[index]}
              entering={FadeIn.delay(220 + Math.min(index, 4) * 80)
                .duration(450)
                .easing(SOFT_EASE)}
              exiting={PREVIEW_ITEM_OUT}
              layout={PREVIEW_LAYOUT}
              style={{ position: "relative", marginTop: 5 }}
            >
              {/* Presionar para ver a pantalla completa */}
              <Pressable onPress={() => onOpenImage(images, index)}>
                <Image
                  source={{ uri }}
                  contentFit="cover"
                  transition={300}
                  style={{
                    width: 73.5,
                    height: 73.5,
                    borderRadius: 15,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                />
              </Pressable>

              {/* Botón × para descartar */}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Quitar foto"
                onPress={() => onRemoveImage(index)}
                scaleTo={0.85}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  backgroundColor: "#101010",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 0,
                  borderColor: "#FFFFFF",
                  zIndex: 20,
                }}
              >
                <CloseXIcon size={12} color="#FFFFFF" />
              </PressableScale>
            </Animated.View>
          ))}
        </Animated.ScrollView>
      )}

      {/* Fila del input + botón enviar. El input es la píldora de cristal de los buscadores */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <PildoraCristal style={{ flex: 1 }} contentStyle={ESTILO_INPUT}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Adjuntar fotos"
            onPress={onPickImages}
            scaleTo={0.9}
            style={{
              width: LADO_ADJUNTAR,
              height: LADO_ADJUNTAR,
              borderRadius: LADO_ADJUNTAR / 2,
              backgroundColor: isDark ? "#ffffff14" : "#0000000d",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name="attach"
              size={24}
              color={isDark ? "#F1F5F9" : "#101010"}
            />
          </PressableScale>

          <TextInput
            accessibilityLabel="Escribe un mensaje"
            value={draft}
            onChangeText={onChangeDraft}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            style={[
              styles.messageInput,
              {
                flex: 1,
                backgroundColor: "transparent",
                borderWidth: 0,
                paddingVertical: 0,
                paddingLeft: 0,
                fontFamily: "Inter_500Medium",
                fontSize: 15,
                color: isDark ? "#F1F5F9" : "#101010",
              },
            ]}
          />
        </PildoraCristal>

        <SendButton onPress={onSendPress} sending={sending} />
      </View>
    </Animated.View>
  );
}
