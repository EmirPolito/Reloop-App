import * as SplashScreen from "expo-splash-screen";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { SheetLegal } from "@/features/legal/SheetLegal";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_CONDICIONES,
} from "@/features/legal/textosLegales";
import { IconoCheck } from "@/features/perfil/Perfiliconos";
import { Text } from "@/features/shared/Text";

// preventAutoHideAsync() ya se llama en app/_layout.tsx; aquí solo se oculta (hideAsync).

/**
 * Una sola imagen basta: el logo es un contorno con el interior transparente. Al hacer zoom
 * hacia el centro del cuerpo, el aro sale de la pantalla por los bordes mientras el fondo
 * blanco se desvanece, así que se "atraviesa" el logo hacia la app sin necesitar la
 * máscara con el agujero que usaba la versión sobre fondo negro.
 */
const LOGO = require("../../../assets/logo/logo-azul3.png");
const LOGO_TEXTO = require("../../../assets/images/logoo.png");

/* ------------------------------------------------------------------ */
/* Geometría de los PNG (px de los lienzos originales)                */
/* ------------------------------------------------------------------ */
const CANVAS_W = 1245;
const CANVAS_H = 1260;
// Centro y radio interior del cuerpo del logo: el zoom se ancla ahí, de modo que el aro
// del cuerpo es lo que acaba saliendo por los bordes de la pantalla.
const ORIGIN_X = 620;
const ORIGIN_Y = 680;
const SAFE_RADIUS = 330;

// Resolución real del PNG del logo texto (ajusta estos dos valores a tu archivo)
const TEXTO_CANVAS_W = 500;
const TEXTO_CANVAS_H = 200;

/* ------------------------------------------------------------------ */
/* Ajustes                                                            */
/* ------------------------------------------------------------------ */
const FONDO = "#ffffffff";
const LOGO_WIDTH = 150; // ancho en dp del isotipo
const LOGO_TEXTO_WIDTH = 125; // ancho en dp del logo texto
const LOGO_TEXTO_GAP = 4; // separación vertical entre el isotipo y el logo texto
/** Cuánto sube el bloque del logo y el nombre respecto al centro de la pantalla */
const SUBIR = 85;
/** Azul de los enlaces legales (el de marca) */
const AZUL_ENLACE = "#202020ff";
// 0785FF
/** Rojo suave: borde de la casilla y enlaces cuando se intenta entrar sin aceptar */
const ROJO_ERROR = "#ff5858ff";
const INTRO_FROM = 0.82;
const ANTICIPATION = 0.92; // pequeño "encogimiento" antes de entrar
const INTRO_MS = 800;
const TEXTO_DELAY_MS = 220;
const TEXTO_MS = 520;
const HOLD_MS = 1200;
/** Tras tocar Entrar: lo que espera el zoom para que la pantalla de destino ya esté montada */
const ENTRAR_MS = 140;
/** Aparición de la leyenda y el botón Entrar */
const T_INFERIOR = 150;
const ANTICIPATE_MS = 240;
const EXPAND_MS = 1100;

const SALIDA_SUAVE = Easing.out(Easing.cubic);

// La animación se ve una vez por arranque de la app: si el árbol raíz se vuelve a montar
// en la misma sesión (p. ej. recarga en caliente), no se repite.
let hasPlayed = false;
const oyentesFin = new Set<() => void>();

/**
 * `true` cuando la animación de entrada ya terminó (o ya se vio en este arranque). Sirve
 * para presentar algo encima de la app sin que quede debajo de la animación (onboarding).
 */
export function useIntroTerminada(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      oyentesFin.add(avisar);
      return () => oyentesFin.delete(avisar);
    },
    () => hasPlayed,
  );
}

type Props = {
  children: ReactNode;
  /** false mientras se resuelve la sesión: la salida espera a que sea true. */
  isAppReady?: boolean;
  /**
   * Sin sesión: en lugar de salir sola, la animación se queda en el logo con la leyenda
   * legal y el botón Entrar, y sale al tocarlo.
   */
  requiereEntrar?: boolean;
  /** Al tocar Entrar, justo antes del efecto: lleva a la pantalla de destino (registro). */
  onEntrar?: () => void;
};

/**
 * Animación de entrada sobre toda la app. La app se monta debajo desde el principio, así
 * que al terminar ya está en la pantalla que le corresponde según la sesión (inicio con
 * sesión iniciada). Sin sesión espera a que la persona toque Entrar y la lleva al registro.
 */
export function AnimatedSplash({
  children,
  isAppReady = true,
  requiereEntrar = false,
  onEntrar,
}: Props) {
  const [showOverlay, setShowOverlay] = useState(!hasPlayed);

  const handleFinish = () => {
    hasPlayed = true;
    setShowOverlay(false);
    oyentesFin.forEach((avisar) => avisar());
  };

  return (
    <View style={styles.root}>
      {children}
      {showOverlay && (
        <SplashOverlay
          isAppReady={isAppReady}
          requiereEntrar={requiereEntrar}
          onEntrar={onEntrar}
          onFinish={handleFinish}
        />
      )}
    </View>
  );
}

function SplashOverlay({
  isAppReady,
  requiereEntrar,
  onEntrar,
  onFinish,
}: {
  isAppReady: boolean;
  requiereEntrar: boolean;
  onEntrar?: () => void;
  onFinish: () => void;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const k = LOGO_WIDTH / CANVAS_W;
  const logoW = LOGO_WIDTH;
  const logoH = CANVAS_H * k;

  const textoW = LOGO_TEXTO_WIDTH;
  const textoH = TEXTO_CANVAS_H * (LOGO_TEXTO_WIDTH / TEXTO_CANVAS_W);

  const dx = (ORIGIN_X - CANVAS_W / 2) * k; // punto fijo del zoom respecto al centro
  const dy = (ORIGIN_Y - CANVAS_H / 2) * k;
  const safeR = SAFE_RADIUS * k;
  // El logo está SUBIR dp por encima del centro: su esquina más lejana queda más abajo
  const farthest = Math.hypot(
    winW / 2 + Math.abs(dx),
    winH / 2 + SUBIR + Math.abs(dy),
  );
  // Escala final: el hueco del cuerpo queda más grande que la diagonal de la pantalla
  const maxExpand = (farthest * 1.15) / (safeR * ANTICIPATION);

  const intro = useSharedValue(0);
  const texto = useSharedValue(0);
  const anticipate = useSharedValue(0);
  const expand = useSharedValue(0);

  const [ready, setReady] = useState({
    logoLoaded: false,
    textoLoaded: false,
    laidOut: false,
  });
  const [introDone, setIntroDone] = useState(false);
  const [entrado, setEntrado] = useState(false);
  const [legal, setLegal] = useState<"privacidad" | "terminos" | null>(null);
  const [aceptados, setAceptados] = useState({
    privacidad: false,
    terminos: false,
  });
  const aceptoTodo = aceptados.privacidad && aceptados.terminos;
  // Se activa al tocar Entrar sin aceptar: la casilla se marca en rojo hasta que se acepte
  const [intentoSinAceptar, setIntentoSinAceptar] = useState(false);
  const casillaError = intentoSinAceptar && !aceptoTodo;
  const esperandoEntrar = requiereEntrar && !entrado;
  const mostrarEntrar = introDone && isAppReady && esperandoEntrar;

  const marcarTodo = () => {
    const valor = !aceptoTodo;
    setAceptados({ privacidad: valor, terminos: valor });
  };

  const aceptar = (documento: "privacidad" | "terminos") =>
    setAceptados((actual) => ({ ...actual, [documento]: true }));

  const entrar = () => {
    if (entrado) return;
    if (!aceptoTodo) {
      setIntentoSinAceptar(true);
      return;
    }
    setLegal(null);
    onEntrar?.();
    setEntrado(true);
  };

  // Si la imagen principal falla no se bloquea la app: se omite la animación
  const onImageError = () => {
    SplashScreen.hideAsync().catch(() => {});
    onFinish();
  };

  // 1) Con ambas imágenes cargadas y la vista medida: se oculta la splash nativa y empieza la entrada
  useEffect(() => {
    if (!ready.logoLoaded || !ready.textoLoaded || !ready.laidOut) return;
    let cancelled = false;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        intro.set(
          withTiming(1, { duration: INTRO_MS, easing: SALIDA_SUAVE }, (ok) => {
            if (ok) scheduleOnRN(setIntroDone, true);
          }),
        );
        texto.set(
          withDelay(
            TEXTO_DELAY_MS,
            withTiming(1, { duration: TEXTO_MS, easing: SALIDA_SUAVE }),
          ),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [ready, intro, texto]);

  // 2) Terminada la entrada y resuelta la sesión: pausa, anticipación y zoom hacia la app.
  //    Sin sesión, espera a que se toque Entrar y entonces arranca casi de inmediato.
  useEffect(() => {
    if (!introDone || !isAppReady || esperandoEntrar) return;
    anticipate.set(
      withDelay(
        entrado ? ENTRAR_MS : HOLD_MS,
        withTiming(
          1,
          { duration: ANTICIPATE_MS, easing: Easing.out(Easing.quad) },
          (ok) => {
            if (!ok) return;
            expand.set(
              withTiming(
                1,
                { duration: EXPAND_MS, easing: Easing.bezier(0.7, 0, 0.3, 1) },
                (done) => {
                  if (done) scheduleOnRN(onFinish);
                },
              ),
            );
          },
        ),
      ),
    );
  }, [
    introDone,
    isAppReady,
    esperandoEntrar,
    entrado,
    anticipate,
    expand,
    onFinish,
  ]);

  // Escala anclada en (dx, dy), interpolada en espacio logarítmico para que la velocidad
  // percibida del zoom sea constante, sin acelerones al final.
  const stageStyle = useAnimatedStyle(() => {
    const base =
      interpolate(intro.get(), [0, 1], [INTRO_FROM, 1]) *
      interpolate(anticipate.get(), [0, 1], [1, ANTICIPATION]);
    const s = base * Math.exp(Math.log(maxExpand) * expand.get());
    return {
      opacity:
        interpolate(intro.get(), [0, 0.6], [0, 1], Extrapolation.CLAMP) *
        interpolate(expand.get(), [0.55, 0.9], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: dx * (1 - s) },
        { translateY: dy * (1 - s) },
        { scale: s },
      ],
    };
  });

  // El logo texto sube un poco al aparecer y se va primero, antes de que el isotipo crezca
  const textoStyle = useAnimatedStyle(() => ({
    opacity:
      texto.get() *
      interpolate(anticipate.get(), [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: (1 - texto.get()) * 8 }],
  }));

  // El fondo blanco se desvanece mientras se atraviesa el logo: la app aparece dentro del aro
  const fondoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expand.get(),
      [0.15, 0.6],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={() => setReady((r) => ({ ...r, laidOut: true }))}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.fondo, fondoStyle]}
      />

      <View
        style={[styles.center, { transform: [{ translateY: -SUBIR }] }]}
        pointerEvents="none"
      >
        <Animated.View style={[{ width: logoW, height: logoH }, stageStyle]}>
          <Image
            source={LOGO}
            style={{ width: logoW, height: logoH }}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setReady((r) => ({ ...r, logoLoaded: true }))}
            onError={onImageError}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.texto,
            { marginTop: logoH / 2 + LOGO_TEXTO_GAP },
            textoStyle,
          ]}
        >
          <Image
            source={LOGO_TEXTO}
            style={{ width: textoW, height: textoH }}
            resizeMode="contain"
            fadeDuration={0}
            onLoad={() => setReady((r) => ({ ...r, textoLoaded: true }))}
            onError={() => setReady((r) => ({ ...r, textoLoaded: true }))}
          />
        </Animated.View>
      </View>

      {mostrarEntrar ? (
        <Animated.View
          exiting={FadeOut.duration(160)}
          style={[styles.inferior, { paddingBottom: insets.bottom + 5 }]}
        >
          <Animated.View entering={FadeInDown.delay(T_INFERIOR).duration(600)}>
            <Pressable
              accessibilityRole="button"
              onPress={entrar}
              className="bg-gradient-to-br from-black/95 to-black/85 mt-0 h-[54px] w-full items-center justify-center rounded-full"
              style={{
                shadowColor: "#2a2a2aff",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 5,
              }}
            >
              <Text className="text-[16px] font-medium text-white">Entrar</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(T_INFERIOR + 300).duration(600)}
            style={styles.leyenda}
          >
            <Casilla
              marcada={aceptoTodo}
              error={casillaError}
              onPress={marcarTodo}
            />
            <Text style={styles.leyendaTexto}>Acepto la </Text>
            <EnlaceLegal
              texto="Política de privacidad"
              error={casillaError}
              onPress={() => setLegal("privacidad")}
            />
            <Text style={styles.leyendaTexto}> y los </Text>
            <EnlaceLegal
              texto="Términos y condiciones"
              error={casillaError}
              onPress={() => setLegal("terminos")}
            />
          </Animated.View>
        </Animated.View>
      ) : null}

      {/* La splash es siempre clara: los drawers van en tema claro */}
      <SheetLegal
        documento={POLITICA_PRIVACIDAD}
        visible={legal === "privacidad"}
        isDark={false}
        onClose={() => setLegal(null)}
        onAceptar={() => aceptar("privacidad")}
      />
      <SheetLegal
        documento={TERMINOS_CONDICIONES}
        visible={legal === "terminos"}
        isDark={false}
        onClose={() => setLegal(null)}
        onAceptar={() => aceptar("terminos")}
      />
    </View>
  );
}

/**
 * Casilla de aceptación: blanca con borde gris; marcada, azul con la palomita blanca.
 * Es propia (no la de HeroUI) para controlar colores y tamaño igual en Android, iOS y web.
 */
function Casilla({
  marcada,
  error = false,
  onPress,
}: {
  marcada: boolean;
  /** Borde rojo: se tocó Entrar sin aceptar */
  error?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel="Acepto la Política de privacidad y los Términos y condiciones"
      accessibilityHint={
        error ? "Marca la casilla para poder entrar" : undefined
      }
      hitSlop={10}
      onPress={onPress}
      style={[
        styles.casilla,
        error && styles.casillaError,
        marcada && styles.casillaMarcada,
      ]}
    >
      {marcada ? <IconoCheck size={12} color="#FFFFFF" /> : null}
    </Pressable>
  );
}

/**
 * Enlace dentro de la leyenda legal. Sustituye a `LinkButton` de HeroUI: su `Button` base
 * calcula un color de resaltado del tema que en web no se puede leer y llena la consola
 * de errores, aunque el resaltado esté desactivado.
 */
function EnlaceLegal({
  texto,
  error = false,
  onPress,
}: {
  texto: string;
  /** En rojo suave junto con la casilla: se tocó Entrar sin aceptar */
  error?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={texto}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Text style={[styles.enlace, error && styles.enlaceError]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  fondo: { backgroundColor: FONDO },
  // Fuera del flujo: el logo queda centrado igual que en la splash nativa
  texto: {
    position: "absolute",
    top: "50%",
  },
  inferior: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 0,
    gap: 12.5,
  },
  // Casilla y texto en una sola línea que se parte si no cabe; cada línea queda centrada
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  casilla: {
    width: 16,
    height: 16,
    marginRight: 7,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#d9d9d9ff",
    backgroundColor: "#ffffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  casillaError: {
    borderColor: ROJO_ERROR,
  },
  casillaMarcada: {
    backgroundColor: AZUL_ENLACE,
    borderColor: AZUL_ENLACE,
  },
  leyendaTexto: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 21,
    color: "#838383ff",
  },
  enlace: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    lineHeight: 23.5,
    color: AZUL_ENLACE,
  },
  enlaceError: {
    color: ROJO_ERROR,
  },
});
