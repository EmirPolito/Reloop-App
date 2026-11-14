import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/features/shared/Text";
import { useAuthCarousel } from "../hooks/useAuthCarousel";
import { useFloatingLoops } from "../hooks/useFloatingLoops";
import { authStyles } from "./authStyles";
import type { AuthLayoutVariant } from "./authVariants";

export interface AuthSlide {
  id: string;
  title: string;
  subtitle: string;
  images: { left: number; center: number; right: number };
}

const DOT_HIT_SLOP = { top: 8, bottom: 8, left: 6, right: 6 };
const LINK_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

function FloatingImage({
  source,
  offset,
  rotate,
  size,
  position,
}: {
  source: number;
  offset: Animated.Value;
  rotate: string;
  size: "100%" | "110%";
  position: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={[
        authStyles.floatingImageWrapper,
        position,
        { transform: [{ translateY: offset }, { rotate }] },
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

/**
 * Estructura común de acceso y registro: tres imágenes flotantes que cambian con
 * el carrusel arriba y, abajo, una tarjeta blanca con el texto, los puntos del
 * carrusel, el contenido propio de cada pantalla (`children`) y el enlace final.
 */
export function AuthCarouselLayout({
  slides,
  variant,
  paused,
  footerPrompt,
  footerAction,
  onFooterPress,
  afterFooter,
  children,
}: {
  slides: AuthSlide[];
  variant: AuthLayoutVariant;
  /** Detiene el avance automático (p. ej. mientras se escribe el correo). */
  paused: boolean;
  footerPrompt: string;
  footerAction: string;
  onFooterPress: () => void;
  /** Contenido opcional debajo del enlace final (p. ej. la leyenda legal del registro). */
  afterFooter?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { activeSlide, goToSlide, fade, scale, panHandlers } = useAuthCarousel(
    slides.length,
    paused,
  );
  const floats = useFloatingLoops();

  const slide = slides[activeSlide];
  const maxContentWidth = Math.min(width - 12, 440);

  return (
    <View style={[authStyles.root, variant.root]}>
      <StatusBar style="dark" />

      {/* PARTE SUPERIOR: fondo gris claro con 3 imágenes 3D flotantes */}
      <View
        style={[authStyles.topSection, { paddingTop: Math.max(insets.top, 24) }]}
        {...panHandlers}
      >
        <Animated.View
          style={[
            authStyles.floatingGroup,
            { opacity: fade, transform: [{ scale }] },
          ]}
        >
          {/* Sombra de suelo / forma redondeada deforme sin puntos */}
          <View style={authStyles.floorShadowContainer}>
            <Svg width={260} height={60} viewBox="0 0 260 60">
              <Path
                d="M 46,30 C 26,22 16,36 28,45 C 38,51 52,47 68,52 C 86,58 108,61 134,60 C 164,59 192,62 216,53 C 236,46 250,37 244,27 C 237,17 215,21 194,17 C 172,12 148,15 124,12 C 94,9 70,16 52,23 C 44,26 34,29 46,30 Z"
                fill={variant.floorShadowFill}
              />
            </Svg>
          </View>

          <FloatingImage
            source={slide.images.left}
            offset={floats.left}
            rotate="-18deg"
            size={variant.imageSize}
            position={authStyles.leftImagePos}
          />
          <FloatingImage
            source={slide.images.right}
            offset={floats.right}
            rotate="20deg"
            size={variant.imageSize}
            position={authStyles.rightImagePos}
          />
          {/* Imagen central (Hero) */}
          <FloatingImage
            source={slide.images.center}
            offset={floats.center}
            rotate="6deg"
            size={variant.imageSize}
            position={[authStyles.centerImagePos, variant.centerImage]}
          />
        </Animated.View>
      </View>

      {/* CARD INFERIOR: drawer blanco, plano y largo abajo */}
      <KeyboardAvoidingView
        style={authStyles.bottomWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            authStyles.drawerCard,
            variant.drawerShadow,
            {
              paddingBottom: Math.max(insets.bottom + 14, 24),
              maxWidth: maxContentWidth,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={authStyles.drawerScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.Text style={[authStyles.slideTitle, { opacity: fade }]}>
              {slide.title}
            </Animated.Text>

            <Animated.Text
              style={[
                authStyles.slideSubtitle,
                variant.subtitle,
                { opacity: fade },
              ]}
            >
              {slide.subtitle}
            </Animated.Text>

            {/* Puntos del carrusel (con una sola diapositiva no hay nada que elegir) */}
            <View
              style={[
                authStyles.dotsRow,
                slides.length < 2 && authStyles.dotsRowSingle,
              ]}
            >
              {slides.length < 2 ? null : slides.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => goToSlide(index)}
                  hitSlop={DOT_HIT_SLOP}
                  accessibilityLabel={`Ir a diapositiva ${index + 1}`}
                >
                  <View
                    style={[
                      authStyles.dot,
                      index === activeSlide
                        ? authStyles.dotActive
                        : authStyles.dotInactive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>

            {children}

            {/* Enlace a la otra pantalla */}
            <View style={authStyles.footerRow}>
              <Text style={authStyles.footerText}>{footerPrompt} </Text>
              <Pressable
                accessibilityRole="link"
                onPress={onFooterPress}
                hitSlop={LINK_HIT_SLOP}
              >
                <Text style={authStyles.footerLink}>{footerAction}</Text>
              </Pressable>
            </View>

            {afterFooter}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
