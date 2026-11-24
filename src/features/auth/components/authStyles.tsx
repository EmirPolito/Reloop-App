/**
 * Piezas y estilos compartidos por las pantallas de acceso:
 * - `PantallaCristal`: Iniciar sesión y Registrarse (fondo desenfocado y card de cristal).
 * - `PantallaCurva`: Recuperar contraseña y Verificar correo (parte oscura y card blanca curva).
 * - `CampoCristal`, `EnlaceCristal`, `estilosCristal` y `validarPorCampo`: los usan todas.
 */
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Text, TextInput } from "@/features/shared/Text";
import { validarPorCampo } from "@/utils/validation";

// La validación vive en utils (sin React Native, se puede probar); se reexporta para las pantallas
export { validarPorCampo };

/** Imagen de fondo: se puede cambiar reemplazando este archivo. */
const FONDO = require("@/assets/images/auth/fondo.jpeg");

/** Logo que aparece hasta arriba de la pantalla. */
const LOGO = require("@/assets/images/auth/logo.png");
const LOGO_TAMANO = 78;

/** Imagen de una de las 3 tarjetas del abanico; cada pantalla define las suyas. */
export type TarjetaAbanico = {
  source: number;
  position?: "left top" | "center" | "right bottom";
};

/**
 * Desenfoque suave-medio: mantiene definidas las formas de fondo
 * sin perder la saturación de los colores.
 */
const DESENFOQUE_IMAGEN = Platform.OS === "android" ? 16 : 12;

export const BLANCO = "#FFFFFF";
export const TINTA_TENUE = "#00000087";
/** Placeholder de los campos: más suave que los iconos. */
const TINTA_PLACEHOLDER = "#00000070";
/** Cursor y selección de los campos (blancos): oscuros para que se vean */
const TINTA_CURSOR = "#101010";
export const ROJO_ERROR = "#ff463cff";
const LINK_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const ANCHO_MAXIMO = 420;
const CURVA_SUAVE = Easing.bezier(0.22, 1, 0.36, 1);

/** "Reducir transparencia" del sistema (iOS) o `prefers-reduced-transparency` (web). */
function useReducirTransparencia(): boolean {
  const [reducir, setReducir] = useState(
    () =>
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-transparency: reduce)").matches,
  );
  useEffect(() => {
    if (Platform.OS === "web") {
      const consulta = window.matchMedia(
        "(prefers-reduced-transparency: reduce)",
      );
      const alCambiar = (e: MediaQueryListEvent) => setReducir(e.matches);
      consulta.addEventListener("change", alCambiar);
      return () => consulta.removeEventListener("change", alCambiar);
    }
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReducir);
    const suscripcion = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReducir,
    );
    return () => suscripcion.remove();
  }, []);
  return reducir;
}

/**
 * Pantalla de acceso con fondo desenfocado, logo, abanico de tarjetas,
 * título y una card de cristal.
 * El contenido de la card (campos y botón) y lo que va debajo se pasan desde cada pantalla.
 */
export function PantallaCristal({
  titulo,
  subtitulo,
  tarjetas,
  pie,
  children,
}: {
  titulo: string;
  /** Descripción bajo el título; si no se pasa, no se muestra. */
  subtitulo?: string;
  /** Imágenes del abanico: izquierda, centro y derecha. */
  tarjetas: [TarjetaAbanico, TarjetaAbanico, TarjetaAbanico];
  pie?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const sinTransparencia = useReducirTransparencia();
  const sinMovimiento = useReducedMotion();

  const conDesenfoque = Platform.OS !== "android" && !sinTransparencia;

  // Entrada de la card solo con translateY (sin scale) para evitar que los textos de las píldoras brinquen
  const entradaCard = useSharedValue(sinMovimiento ? 1 : 0);

  useEffect(() => {
    if (sinMovimiento) {
      entradaCard.set(1);
      return;
    }
    entradaCard.set(
      withDelay(
        110,
        withTiming(1, {
          duration: 600,
          easing: CURVA_SUAVE,
        }),
      ),
    );
  }, [sinMovimiento, entradaCard]);

  const estiloEntradaCard = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(entradaCard.value, [0, 1], [12, 0]) },
    ],
  }));

  const entradaSuave = (delayMs: number) =>
    sinMovimiento
      ? undefined
      : FadeIn.duration(520).delay(delayMs).easing(CURVA_SUAVE);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* 1 · Imagen de fondo desenfocada conservando sus colores vivos */}
      <Image
        source={FONDO}
        contentFit="cover"
        blurRadius={DESENFOQUE_IMAGEN}
        style={[StyleSheet.absoluteFill, styles.imagenFondo]}
      />

      {/* Sombra mínima solo para dar legibilidad al texto blanco sin apagar los colores */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.atenuarFoto]}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[styles.pantalla, sinTransparencia && styles.pantallaSolida]}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.contenido,
              {
                paddingTop: insets.top + 4,
                paddingBottom: insets.bottom + 14,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bounces={false}
          >
            {/* ── LOGO HASTA ARRIBA ──────────────────────────────── */}
            <Animated.View entering={entradaSuave(0)} style={styles.logoTop}>
              <Image
                source={LOGO}
                contentFit="contain"
                transition={0}
                accessibilityLabel="Logo de ReLoop"
                style={styles.logo}
              />
            </Animated.View>

            {/* ── BLOQUE CENTRAL ELEVADO ─────────────────────────── */}
            <View style={styles.centroContenedor}>
              {/* 3 tarjetas en abanico + Título + Descripción ancha */}
              <View style={styles.marca}>
                <AbanicoTarjetas
                  tarjetas={tarjetas}
                  sinMovimiento={Boolean(sinMovimiento)}
                />

                <Animated.View
                  entering={entradaSuave(140)}
                  style={styles.textosMarca}
                >
                  <Text accessibilityRole="header" style={styles.titulo}>
                    {titulo}
                  </Text>
                  {subtitulo ? (
                    <Text style={styles.subtitulo}>{subtitulo}</Text>
                  ) : null}
                </Animated.View>
              </View>

              <View style={styles.columna}>
                {/* Card de cristal translúcida */}
                <Animated.View
                  style={[
                    styles.tarjeta,
                    sinTransparencia && styles.tarjetaSolida,
                    estiloEntradaCard,
                  ]}
                >
                  {conDesenfoque ? (
                    <BlurView
                      intensity={24}
                      tint="light"
                      style={[StyleSheet.absoluteFill, styles.capaDesenfoque]}
                    />
                  ) : null}

                  {children}
                </Animated.View>

                {pie ? (
                  <Animated.View entering={entradaSuave(260)}>
                    {pie}
                  </Animated.View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Color de la parte de arriba de `PantallaCurva`. */
const COLOR_FONDO_CURVA = "#181818ff";
const IMAGEN_CURVA_TAMANO = 145;
const ALTO_CURVA = 60;

/**
 * Pantalla con la parte de arriba oscura (logo, título, descripción e imagen)
 * y una card blanca con el borde superior curvo donde va el formulario.
 * La imagen no se anima para que aparezca de inmediato.
 */
export function PantallaCurva({
  titulo,
  descripcion,
  imagen,
  imagenLabel,
  children,
}: {
  titulo: string;
  descripcion: string;
  imagen: number;
  imagenLabel: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sinMovimiento = useReducedMotion();

  const aparecer = (delayMs: number) =>
    sinMovimiento
      ? undefined
      : FadeIn.duration(520).delay(delayMs).easing(CURVA_SUAVE);

  return (
    <View style={styles.curvaRoot}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.curvaContenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Parte oscura: logo, título, descripción e imagen ── */}
          <View style={[styles.curvaArriba, { paddingTop: insets.top + 4 }]}>
            <Animated.View entering={aparecer(0)}>
              <Image
                source={LOGO}
                contentFit="contain"
                transition={0}
                accessibilityLabel="Logo de ReLoop"
                style={styles.logo}
              />
            </Animated.View>

            <View style={styles.flex} />

            <Animated.View entering={aparecer(60)} style={styles.curvaTextos}>
              <Text accessibilityRole="header" style={styles.curvaTitulo}>
                {titulo}
              </Text>
              <Text style={styles.curvaDescripcion}>{descripcion}</Text>
            </Animated.View>

            <Image
              source={imagen}
              contentFit="contain"
              transition={0}
              accessibilityLabel={imagenLabel}
              style={styles.curvaImagen}
            />
          </View>

          {/* ── Card blanca con borde superior curvo ── */}
          <Animated.View
            entering={
              sinMovimiento
                ? undefined
                : FadeInDown.duration(600).delay(110).easing(CURVA_SUAVE)
            }
            style={[styles.curvaCard, { minHeight: height * 0.46 }]}
          >
            <Svg
              width="100%"
              height={ALTO_CURVA}
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              style={styles.curvaBorde}
            >
              <Path d="M0 20 Q50 -20 100 20 Z" fill={BLANCO} />
            </Svg>

            <View
              style={[
                styles.curvaCardContenido,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              {children}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * Enlace de texto que va debajo de la card: un prefijo opcional
 * y la acción (en semibold), que es lo único que responde al toque y al hover.
 */
export function EnlaceCristal({
  prefijo,
  texto,
  onPress,
  oscuro = false,
}: {
  prefijo?: string;
  texto: string;
  onPress: () => void;
  /** Texto oscuro, para usarlo sobre fondo claro. */
  oscuro?: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <View style={styles.enlaceFila}>
      {prefijo ? (
        <Text style={[styles.olvidoTexto, oscuro && styles.enlaceOscuro]}>
          {prefijo}{" "}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="link"
        onPress={onPress}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        hitSlop={LINK_HIT_SLOP}
      >
        {({ pressed }) => (
          <Text
            style={[
              styles.olvidoTexto,
              prefijo && styles.enlaceAccion,
              oscuro && styles.enlaceOscuro,
              oscuro && prefijo && styles.enlaceAccionOscura,
              (pressed || hover) && { opacity: 0.6 },
            ]}
          >
            {texto}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

/**
 * 3 tarjetas en abanico con despliegue suave:
 * aparecen progresivamente mientras abren su ángulo desde el centro.
 */
function AbanicoTarjetas({
  tarjetas,
  sinMovimiento,
}: {
  tarjetas: [TarjetaAbanico, TarjetaAbanico, TarjetaAbanico];
  sinMovimiento: boolean;
}) {
  const progreso = useSharedValue(sinMovimiento ? 1 : 0);

  useEffect(() => {
    if (sinMovimiento) {
      progreso.set(1);
      return;
    }
    progreso.set(
      withDelay(
        60,
        withTiming(1, {
          duration: 850,
          easing: CURVA_SUAVE,
        }),
      ),
    );
  }, [sinMovimiento, progreso]);

  const estiloIzq = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      opacity: interpolate(p, [0, 0.15, 1], [0, 0, 1]),
      transform: [
        { translateX: interpolate(p, [0, 1], [-14, -40]) },
        { translateY: interpolate(p, [0, 1], [10, 5]) },
        { rotate: `${interpolate(p, [0, 1], [-3, -14])}deg` },
      ],
    };
  });

  const estiloDer = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      opacity: interpolate(p, [0, 0.15, 1], [0, 0, 1]),
      transform: [
        { translateX: interpolate(p, [0, 1], [14, 40]) },
        { translateY: interpolate(p, [0, 1], [10, 5]) },
        { rotate: `${interpolate(p, [0, 1], [3, 14])}deg` },
      ],
    };
  });

  const estiloCentro = useAnimatedStyle(() => {
    const p = progreso.value;
    return {
      opacity: interpolate(p, [0, 0.85], [0, 1]),
      transform: [{ translateY: interpolate(p, [0, 1], [8, 0]) }],
    };
  });

  return (
    <View style={styles.abanicoContenedor} pointerEvents="none">
      {/* Tarjeta izquierda */}
      <Animated.View
        style={[styles.tarjetaAbanico, styles.tarjetaAbanicoIzq, estiloIzq]}
      >
        <Image
          source={tarjetas[0].source}
          contentFit="cover"
          contentPosition={tarjetas[0].position}
          transition={0}
          style={styles.tarjetaAbanicoImagen}
        />
      </Animated.View>

      {/* Tarjeta derecha */}
      <Animated.View
        style={[styles.tarjetaAbanico, styles.tarjetaAbanicoDer, estiloDer]}
      >
        <Image
          source={tarjetas[2].source}
          contentFit="cover"
          contentPosition={tarjetas[2].position}
          transition={0}
          style={styles.tarjetaAbanicoImagen}
        />
      </Animated.View>

      {/* Tarjeta central (al frente) */}
      <Animated.View
        style={[
          styles.tarjetaAbanico,
          styles.tarjetaAbanicoCentro,
          estiloCentro,
        ]}
      >
        <Image
          source={tarjetas[1].source}
          contentFit="cover"
          contentPosition={tarjetas[1].position}
          transition={0}
          style={styles.tarjetaAbanicoImagen}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Campo de altura fija: mantiene siempre su borde blanco translúcido.
 * El mensaje de error en rojo se superpone al texto y desaparece (con un desvanecido
 * suave) al tocar el campo o al empezar a escribir.
 * El valor nunca se borra: al escribir se continúa sobre lo que ya había.
 */
export function CampoCristal({
  icon,
  accion,
  error,
  estiloCampo,
  onQuitarError,
  ...inputProps
}: TextInputProps & {
  icon: ReactNode;
  accion?: ReactNode;
  error?: string;
  /** Ajustes del contenedor del campo (p. ej. otro fondo sobre una card blanca). */
  estiloCampo?: StyleProp<ViewStyle>;
  /** Quita el error; se llama al tocar el campo mientras se muestra */
  onQuitarError?: () => void;
}) {
  const hayError = Boolean(error);
  // En iOS una vista con opacidad 0 no recibe toques: mientras se ve el error, el input
  // queda invisible y no se podría enfocar. Por eso todo el campo enfoca el input al tocarlo.
  const inputRef = useRef<TextInputInstance>(null);

  // Opacidad del texto real: se oculta rápido al aparecer el error
  // y regresa suavemente mientras el error se desvanece.
  const visibilidadTexto = useSharedValue(hayError ? 0 : 1);

  useEffect(() => {
    visibilidadTexto.set(
      withTiming(hayError ? 0 : 1, {
        duration: hayError ? 140 : 280,
        easing: CURVA_SUAVE,
      }),
    );
  }, [hayError, visibilidadTexto]);

  const estiloTexto = useAnimatedStyle(() => ({
    opacity: visibilidadTexto.value,
  }));

  return (
    <Pressable
      accessible={false}
      onPress={() => inputRef.current?.focus()}
      style={[styles.campo, estiloCampo]}
    >
      <View style={styles.campoFila}>
        {icon}
        <View style={styles.campoZonaTexto}>
          <Animated.View style={[styles.campoCapaTexto, estiloTexto]}>
            <TextInput
              ref={inputRef}
              placeholderTextColor={TINTA_PLACEHOLDER}
              // El cursor y la selección en oscuro: sobre el campo blanco no se veían
              selectionColor={TINTA_CURSOR}
              cursorColor={TINTA_CURSOR}
              style={styles.campoTexto}
              {...inputProps}
              onFocus={(e) => {
                // Al tocar el campo se quita el error para escribir de nuevo
                if (hayError) onQuitarError?.();
                inputProps.onFocus?.(e);
              }}
            />
          </Animated.View>

          {hayError ? (
            <Animated.View
              key={error}
              pointerEvents="none"
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(280).easing(CURVA_SUAVE)}
              style={styles.campoCapaError}
            >
              <Text
                numberOfLines={1}
                accessibilityLiveRegion="polite"
                style={styles.campoTextoError}
              >
                {error}
              </Text>
            </Animated.View>
          ) : null}
        </View>
        {accion}
      </View>
    </Pressable>
  );
}

export const SOMBRA_TEXTO = {
  textShadowColor: "rgba(0, 0, 0, 0.18)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
};

/** Borde fino con reflejo superior. */
const BORDE_LUZ = {
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.27)",
  borderTopColor: "rgba(255, 255, 255, 0.31)",
} as const;

/** Estilos que cada pantalla usa dentro de la card (formulario y botón). */
export const estilosCristal = StyleSheet.create({
  formulario: { gap: 13.5 },

  // Botón píldora blanca
  boton: {
    height: 50,
    marginTop: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101010",
  },
  botonDeshabilitado: { opacity: 0.6 },
  // Un poco más alto: los botones de la card blanca (Verificar correo y Recuperar contraseña)
  botonAlto: { height: 56 },
  // Botón blanco con borde para la acción secundaria
  botonSecundario: {
    backgroundColor: BLANCO,
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
  },
  botonSecundarioTexto: { color: "#101010" },
  // Separación corta entre el campo y el botón dentro de la card blanca
  botonCerca: { marginTop: 15 },
  // Primer botón de la card blanca cuando no hay campo arriba
  botonPrimero: { marginTop: 0 },
  // Campo gris para que se distinga sobre la card blanca
  campoClaro: { backgroundColor: "#F2F2F4", borderColor: "#E7E7EA" },
  // Avisos bajo los botones en la card blanca
  aviso: {
    marginTop: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    color: TINTA_TENUE,
  },
  avisoError: { color: ROJO_ERROR },
  botonTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
    textAlign: "center",
    color: "#ffffff",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden", backgroundColor: "#141820" },
  flex: { flex: 1 },
  imagenFondo: {
    transform: [{ scale: 1.03 }],
  },
  atenuarFoto: { backgroundColor: "rgba(0, 0, 0, 0.18)" },

  pantalla: {
    flex: 1,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  pantallaSolida: { backgroundColor: "#1C212B" },
  capaDesenfoque: { zIndex: -1 },

  contenido: {
    flexGrow: 1,
    paddingHorizontal: 19,
  },

  // Logo anclado hasta arriba
  logoTop: {
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 2,
  },
  logo: {
    width: LOGO_TAMANO,
    height: LOGO_TAMANO,
    borderRadius: 19,
  },

  // Contenedor ligeramente elevado para acercar las cards al logo
  centroContenedor: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 22,
    width: "100%",
  },
  columna: { width: "100%", maxWidth: ANCHO_MAXIMO, alignSelf: "center" },

  // Abanico de tarjetas + Marca a lo ancho
  marca: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
  abanicoContenedor: {
    width: 174,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  tarjetaAbanico: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: BLANCO,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tarjetaAbanicoIzq: {
    width: 57,
    height: 75,
    borderRadius: 15,
    zIndex: 1,
  },
  tarjetaAbanicoDer: {
    width: 57,
    height: 75,
    borderRadius: 15,
    zIndex: 1,
  },
  tarjetaAbanicoCentro: {
    width: 65,
    height: 85,
    borderRadius: 15,
    zIndex: 2,
  },
  tarjetaAbanicoImagen: {
    width: "100%",
    height: "100%",
  },

  textosMarca: {
    width: "100%",
    alignItems: "center",
  },
  titulo: {
    fontFamily: "Inter_500Medium",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.8,
    textAlign: "center",
    color: BLANCO,
    ...SOMBRA_TEXTO,
  },
  subtitulo: {
    width: "100%",
    marginTop: 3.5,
    paddingHorizontal: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: "center",
    color: "#ffffffeb",
    ...SOMBRA_TEXTO,
  },

  // Card de cristal translúcida
  tarjeta: {
    zIndex: 0,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    borderRadius: 28,
    backgroundColor: "#ffffff42",
  },
  tarjetaSolida: { backgroundColor: "rgba(30, 35, 45, 0.95)" },

  // Campos de altura fija con texto de error rojo sin cambiar el borde
  campo: {
    justifyContent: "center",
    height: 53,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#ffffffff",
    ...BORDE_LUZ,
  },
  campoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: "100%",
  },
  campoZonaTexto: {
    flex: 1,
    minWidth: 0,
    height: "100%",
  },
  campoCapaTexto: { flex: 1 },
  campoCapaError: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
  },
  campoTexto: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14.5,
    letterSpacing: 0.2,
    color: "#000000ff",
    ...SOMBRA_TEXTO,
  },
  campoTextoError: {
    includeFontPadding: false,
    fontFamily: "Inter_400Regular",
    fontSize: 14.5,
    letterSpacing: 0.2,
    color: ROJO_ERROR,
    ...SOMBRA_TEXTO,
  },

  // Enlaces de abajo
  enlaceFila: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 16,
  },
  olvidoTexto: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    letterSpacing: 0.1,
    color: "#ffffffeb",
    ...SOMBRA_TEXTO,
  },
  enlaceAccion: { fontFamily: "Inter_600SemiBold", color: BLANCO },
  enlaceOscuro: {
    color: TINTA_TENUE,
    textShadowColor: "transparent",
    textShadowRadius: 0,
  },
  enlaceAccionOscura: { color: "#101010" },

  // PantallaCurva
  curvaRoot: { flex: 1, backgroundColor: COLOR_FONDO_CURVA },
  curvaContenido: { flexGrow: 1 },
  curvaArriba: {
    flex: 1,
    alignItems: "center",
    // Por encima de la card para que la curva blanca no tape la imagen
    zIndex: 1,
    gap: 19,
    paddingHorizontal: 20,
  },
  curvaTextos: {
    width: "100%",
    maxWidth: ANCHO_MAXIMO,
    alignItems: "center",
    marginBottom: 10,
  },
  curvaTitulo: {
    fontFamily: "Inter_500Medium",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.8,
    textAlign: "center",
    color: BLANCO,
  },
  curvaDescripcion: {
    marginTop: 7,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#ffffffe0",
  },
  curvaImagen: {
    width: IMAGEN_CURVA_TAMANO,
    height: IMAGEN_CURVA_TAMANO,
    // Un poco más abajo sin mover la card
    transform: [{ translateY: 12 }],
  },
  curvaCard: { backgroundColor: BLANCO },
  curvaBorde: {
    position: "absolute",
    top: -ALTO_CURVA + 1,
    left: 0,
    right: 0,
  },
  curvaCardContenido: {
    width: "100%",
    maxWidth: ANCHO_MAXIMO,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 40,
  },
});
