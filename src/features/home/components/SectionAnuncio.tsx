import { Image } from "expo-image";
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
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

const AUTOPLAY_MS = 4000;
const GAP = 13; // separación entre anuncios (ajústala a gusto)

const IMAGE_STYLE = { width: "100%", height: "100%" } as const;

const BANNERS = [
  { id: "banner-1", source: require("@/assets/images/anuncio2.png") },
  { id: "banner-2", source: require("@/assets/images/1er-banner.png") },
  { id: "banner-3", source: require("@/assets/images/anuncio2.png") },
];

const COUNT = BANNERS.length;

export const FeedIntro = memo(function FeedIntro() {
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

  useEffect(() => {
    if (width === 0) return;
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
  }, [width, step, settle]);

  return (
    <View className="w-full mt-[13px] mb-5" onLayout={onLayout}>
      <View
        accessibilityLabel="Carrusel de anuncios de ReLoop"
        className="h-[130px] w-full"
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
                <View className="flex-1 overflow-hidden rounded-[18px]">
                  <Image
                    source={slide.source}
                    contentFit="cover"
                    style={IMAGE_STYLE}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Puntitos */}
      <View className="flex-row items-center justify-center gap-2.5 mt-3">
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
