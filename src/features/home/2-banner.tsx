import { useEnPausa } from "@/components/bloqueoScroll";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

const AUTOPLAY_MS = 4000;
/** Alto del carrusel (en estilo y no en clase: así no depende de que se regenere el CSS) */
const ALTO_BANNER = 145;
/** Espacio bajo cada anuncio para que se vea su sombra (el carrusel recorta lo que sale de él) */
const ESPACIO_SOMBRA = 24;
const GAP = 13; // separación entre anuncios (ajústala a gusto)

const IMAGE_STYLE = { width: "100%", height: "100%" } as const;

const BANNERS = [
  {
    id: "banner-1",
    source: require("@/assets/images/home-banners/anuncio2.png"),
  },
  {
    id: "banner-2",
    source: require("@/assets/images/home-banners/1er-banner.png"),
  },
  {
    id: "banner-3",
    source: require("@/assets/images/home-banners/anuncio2.png"),
  },
];

const COUNT = BANNERS.length;

export const BannerInicio = memo(function BannerInicio() {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const rawRef = useRef(1);

  // Distancia entre el inicio de un slide y el siguiente
  const step = width + GAP;

  const slides = useMemo(
    () => [
      { ...BANNERS[COUNT - 1], key: "clone-start" },
      ...BANNERS.map((banner) => ({ ...banner, key: banner.id })),
      { ...BANNERS[0], key: "clone-end" },
    ],
    [],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const settle = useCallback(
    (raw: number) => {
      let next = raw;
      if (raw === 0) {
        next = COUNT;
        scrollRef.current?.scrollTo({ x: next * step, animated: false });
      } else if (raw === COUNT + 1) {
        next = 1;
        scrollRef.current?.scrollTo({ x: next * step, animated: false });
      }
      rawRef.current = next;
      setIndex(next - 1);
    },
    [step],
  );

  // El punto sigue al dedo: cambia en cuanto el anuncio pasa de la mitad, sin esperar a que
  // el carrusel se detenga (solo re-dibuja cuando cambia de anuncio, no en cada cuadro)
  const alDeslizar = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      const crudo = Math.round(event.nativeEvent.contentOffset.x / step);
      // Los clones de las orillas cuentan como el último y el primero
      setIndex((((crudo - 1) % COUNT) + COUNT) % COUNT);
    },
    [width, step],
  );

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      settle(Math.round(event.nativeEvent.contentOffset.x / step));
    },
    [width, step, settle],
  );

  useEffect(() => {
    if (width === 0) return;
    scrollRef.current?.scrollTo({ x: step, animated: false });
    rawRef.current = 1;
  }, [width, step]);

  // Mientras la pantalla se desplaza no avanza solo (su animación pelearía con el scroll)
  const enPausa = useEnPausa();
  useEffect(() => {
    if (width === 0 || enPausa) return;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setInterval(() => {
      const next = rawRef.current + 1;
      rawRef.current = next;
      scrollRef.current?.scrollTo({ x: next * step, animated: true });
      settleTimer = setTimeout(() => settle(rawRef.current), 500);
    }, AUTOPLAY_MS);
    return () => {
      clearInterval(timer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [width, step, settle, enPausa]);

  return (
    <View className="w-full mb-3" style={{ marginTop: 20 }} onLayout={onLayout}>
      <View
        accessibilityLabel="Carrusel de anuncios de ReLoop"
        className="w-full"
        style={{ height: ALTO_BANNER + ESPACIO_SOMBRA }}
      >
        {width > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            snapToInterval={step}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            onScroll={alDeslizar}
            scrollEventThrottle={32}
            onMomentumScrollEnd={onScrollEnd}
            contentOffset={{ x: step, y: 0 }}
            className="h-full"
          >
            {slides.map((slide) => (
              <View
                key={slide.key}
                className="h-full"
                style={{ width, marginRight: GAP }}
              >
                {/* Sombra de abajo: una franja más angosta que el anuncio que se desvanece hacia
                    abajo, así queda siguiendo su forma y no sale como un cuadro */}
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0)"]}
                  style={estilosBanner.sombra}
                />
                <View style={estilosBanner.anuncio}>
                  <View className="flex-1 overflow-hidden rounded-[18px]">
                    <Image
                      source={slide.source}
                      contentFit="cover"
                      style={IMAGE_STYLE}
                    />
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Puntitos */}
      <View
        className="flex-row items-center justify-center gap-2.5"
        style={{ marginTop: -14 }}
      >
        {BANNERS.map((banner, i) => (
          <View
            key={banner.id}
            className={
              i === index
                ? "size-1.5 rounded-full bg-[#101010]"
                : "size-1.5 rounded-full bg-black/10"
            }
          />
        ))}
      </View>
    </View>
  );
});

const estilosBanner = StyleSheet.create({
  anuncio: { height: ALTO_BANNER, borderRadius: 18 },
  // Asoma por debajo del borde de abajo del anuncio, con las puntas hacia dentro
  sombra: {
    position: "absolute",
    left: 14,
    right: 14,
    top: ALTO_BANNER - 14,
    height: 22,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
