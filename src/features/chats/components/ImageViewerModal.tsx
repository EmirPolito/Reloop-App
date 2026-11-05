import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/features/shared/Text";
import { CloseXIcon } from "./ThreadIcons";

/**
 * Visor de fotos a pantalla completa con deslizamiento lateral.
 * Se muestra mientras `images` tenga elementos; vacío = cerrado.
 */
export function ImageViewerModal({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // La página visible arranca en `initialIndex` cada vez que se abre el visor
  const [page, setPage] = useState(initialIndex);
  const [openedWith, setOpenedWith] = useState({ images, initialIndex });
  if (openedWith.images !== images || openedWith.initialIndex !== initialIndex) {
    setOpenedWith({ images, initialIndex });
    setPage(initialIndex);
  }

  // Android ignora contentOffset: se coloca la página inicial manualmente
  useEffect(() => {
    if (images.length === 0 || initialIndex === 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: initialIndex * screenWidth,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [images, initialIndex, screenWidth]);

  return (
    <Modal
      visible={images.length > 0}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000ff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Botón cerrar */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Cerrar visor de fotos"
          onPress={onClose}
          scaleTo={0.9}
          style={{
            position: "absolute",
            top: insets.top + 20,
            right: 18,
            zIndex: 30,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "#ffffff1c",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CloseXIcon size={22} color="#FFFFFF" />
        </PressableScale>

        {/* Indicador de imagen (ej. 2 / 5) si hay más de 1 imagen */}
        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              top: insets.top + 28,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffff1c",
                paddingHorizontal: 14,
                paddingVertical: 3,
                borderRadius: 11,
              }}
            >
              <Text
                style={{
                  top: 1.5,
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                {page + 1} / {images.length}
              </Text>
            </View>
          </View>
        )}

        {images.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
            onMomentumScrollEnd={(event) => {
              setPage(
                Math.round(event.nativeEvent.contentOffset.x / screenWidth),
              );
            }}
            style={{ width: screenWidth, flex: 1 }}
          >
            {images.map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={{
                  width: screenWidth,
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Animated.View
                  entering={FadeIn.duration(180)}
                  style={{ width: "100%", height: "85%" }}
                >
                  <Image
                    source={{ uri }}
                    contentFit="contain"
                    style={{ width: "100%", height: "100%" }}
                  />
                </Animated.View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}
