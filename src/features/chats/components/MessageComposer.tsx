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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
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

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 2,
      }}
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

      {/* Fila del input + botón enviar — Sin fondo */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#1E293Bd9" : "#ffffffd3",
            borderWidth: 2,
            borderColor: isDark ? "#ffffff22" : "#FFFFFF",
            borderRadius: 30,
            paddingHorizontal: 5,
            paddingVertical: 2.5,
            marginRight: 7,
            minHeight: 44,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adjuntar fotos"
            onPress={onPickImages}
            style={{
              width: 43,
              height: 43,
              borderRadius: 30,
              backgroundColor: isDark ? "#334155" : "#e8e8e8cc",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name="attach"
              size={22}
              color={isDark ? "#F1F5F9" : "#101010"}
            />
          </Pressable>

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
                paddingVertical: 1,
                paddingLeft: 8.5,
                top: 1,
                fontSize: 13.5,
                color: isDark ? "#FFFFFF" : "#000000",
              },
            ]}
          />
        </View>

        <SendButton onPress={onSendPress} sending={sending} />
      </View>
    </View>
  );
}
