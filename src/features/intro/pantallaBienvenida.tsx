import RuedaOrbitalImagenes, {
  type ItemRuedaOrbital,
} from "@/features/intro/imagenesGirando";
import { MarcoIphone, VistaPreviaChat } from "@/features/intro/iphone";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const FONDO = "#f5f5f7";

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=320&h=320&q=80`;

const ITEMS: ItemRuedaOrbital[] = [
  {
    id: "waterfall",
    alt: "Cascada",
    image: u("photo-1469474968028-56623f02e42e"),
  },
  { id: "forest", alt: "Bosque", image: u("photo-1441974231531-c6227db76b6e") },
  { id: "lake", alt: "Lago", image: u("photo-1501785888041-af3ef285b470") },
  { id: "hills", alt: "Colinas", image: u("photo-1472214103451-9374bd1c798e") },
  { id: "peaks", alt: "Picos", image: u("photo-1500530855697-b586d89ba3ee") },
  { id: "rol", alt: "Picos", image: u("photo-1500530855697-b586d89ba3ee") },
];

/* Línea de tiempo de la entrada (ms) */
const T_LOGO = 100;
const T_RUEDA = 400;
const T_IPHONE = 1200;
const T_INFERIOR = 2000;

type Props = {
  onComenzar?: () => void;
  onRegistrarse?: () => void;
};

/** Degradado azul superior que se disuelve en el fondo (detrás del contenido). */
function DegradadoSuperior() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        "#006affff", // azul cielo intenso (arriba)
        "#368affff",
        "#8fd3ff",
        "#ffffffff",
        "rgba(245,245,247,0)", // transparente = FONDO
      ]}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "55%", // ajusta cuánto baja el azul (40% más corto, 65% más largo)
      }}
    />
  );
}

/** iPhone que "se asoma" desde abajo, recortado a la mitad dentro del círculo. */
function IphoneAsomandose({
  phoneW,
  visibleH,
}: {
  phoneW: number;
  visibleH: number;
}) {
  const progreso = useSharedValue(0);

  useEffect(() => {
    progreso.value = withDelay(
      T_IPHONE,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [progreso]);

  const estilo = useAnimatedStyle(() => ({
    opacity: progreso.value,
    transform: [{ translateY: (1 - progreso.value) * visibleH * 0.8 }],
  }));

  return (
    // Ventana de recorte: solo se ve la mitad superior del teléfono
    <View
      className="overflow-hidden"
      style={{ width: phoneW, height: visibleH }}
    >
      <Animated.View style={estilo}>
        <MarcoIphone width={phoneW}>
          <VistaPreviaChat width={phoneW} />
        </MarcoIphone>
      </Animated.View>
      {/* Desvanecido inferior */}
      <LinearGradient
        colors={["rgba(245,245,247,0)", FONDO]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: visibleH * 0.45,
          pointerEvents: "none",
        }}
      />
    </View>
  );
}

export function PantallaBienvenida({ onComenzar, onRegistrarse }: Props) {
  const [area, setArea] = useState({ w: 0, h: 0 });

  const alMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ w: width, h: height });
  };

  // El anillo completo cabe en el área disponible
  const size = Math.max(0, Math.min(area.w, area.h) - 8);
  const itemSize = size * 0.25;
  const radius = (size - itemSize) / 2;
  const innerD = size - itemSize * 2;
  const phoneW = innerD * 0.6;
  const visibleH = phoneW * 2.05 * 0.5;

  return (
    <View style={{ flex: 1, backgroundColor: FONDO }}>
      {/* 0. Degradado azul de fondo (llega hasta arriba del todo) */}
      <DegradadoSuperior />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* 1. Logo centrado */}
        <Animated.View
          entering={FadeInDown.delay(T_LOGO).duration(600)}
          className="w-full items-center px-5 pt-1"
        >
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/logoo.png")}
            contentFit="contain"
            style={{ width: 150, height: 38 }}
          />
        </Animated.View>

        {/* 2. Anillo girando + 3. iPhone asomándose */}
        <View className="flex-1 my-2" onLayout={alMedir}>
          {size > 0 && (
            <Animated.View
              entering={ZoomIn.delay(T_RUEDA).duration(800)}
              className="absolute"
              style={{
                left: (area.w - size) / 2,
                top: (area.h - size) / 2,
                width: size,
                height: size,
              }}
            >
              <RuedaOrbitalImagenes
                items={ITEMS}
                radius={radius}
                itemSize={itemSize}
                autoRotateSpeed={8}
              >
                <IphoneAsomandose phoneW={phoneW} visibleH={visibleH} />
              </RuedaOrbitalImagenes>
            </Animated.View>
          )}
        </View>

        {/* 4. Contenido inferior */}
        <View className="px-5 pb-5 gap-2.5">
          <Animated.Text
            entering={FadeInDown.delay(T_INFERIOR).duration(600)}
            className="text-center text-[31px] leading-9 font-semibold text-black/55"
          >
            Conoce tu campus{" "}
            <Text className="text-black/90 "> {"\n"}y todo lo que ofrece</Text>
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(T_INFERIOR + 150).duration(600)}
            className="-mt-0.5 text-center text-[15px] leading-[22px] text-gray-400 mb-1"
          >
            Compra, vende e intercambia en tu campus.{"\n"}
            Encuentra lo que necesitas y comparte más.
          </Animated.Text>

          <Animated.View
            entering={FadeInDown.delay(T_INFERIOR + 300).duration(600)}
          >
            <Pressable
              onPress={onComenzar}
              className="bg-gradient-to-br from-black/95 to-black/85 mt-1 h-[54px] w-full items-center justify-center rounded-full border border-white/30 active:scale-[0.99]"
              style={{
                shadowColor: "#2a2a2aff",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text className="text-[15.5px] font-semibold text-white">
                Comenzar
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(T_INFERIOR + 450).duration(600)}
            className="flex-row justify-center"
          >
            <Text className="text-[13px] text-gray-500">
              ¿Aún no tienes cuenta?{" "}
            </Text>
            <Pressable onPress={onRegistrarse} hitSlop={8}>
              <Text className="text-[13px] font-semibold text-black/90">
                Regístrate
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
