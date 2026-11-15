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
  View,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, TextInput } from "@/features/shared/Text";
import { validateCredentials } from "@/utils/validation";

/** Imagen de fondo: se puede cambiar reemplazando este archivo. */
const FONDO = require("@/assets/images/auth/fondo.jpeg");

/** Logo que aparece hasta arriba de la pantalla. */
const LOGO = require("@/assets/images/auth/logo.png");
const LOGO_TAMANO = 78;

/**
 * Imágenes de las 3 tarjetas en /** Imagen de una de las 3 tarjetas del abanico; cada pantalla define las suyas. */
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
export const TINTA_TENUE = "rgba(255, 255, 255, 0.9)";
export const ROJO_ERROR = "#ef1f14ff";
const TINTA_OSCURA = "#18181B";
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
 * Convierte los mensajes largos de validación en versiones cortas
 * que quepan en una sola línea dentro del campo.
 */
export function acortarMensaje(
  mensaje: string,
  campo: "correo" | "password",
): string {
  if (!mensaje) return "";
  const msg = mensaje.toLowerCase();

  const vacio =
    msg.includes("ingresa") ||
    msg.includes("obligatori") ||
    msg.includes("requerid") ||
    msg.includes("vací") ||
    msg.includes("vaci");

  if (campo === "correo") {
    if (vacio) return "Ingresa tu correo";
    if (msg.includes("institucional") || msg.includes("dominio"))
      return "Usa tu correo institucional";
    if (
      msg.includes("no existe") ||
      msg.includes("no encontr") ||
      msg.includes("no registrad")
    )
      return "Correo no registrado";
    return "Correo no válido";
  }

  if (vacio) return "Ingresa tu contraseña";
  const minimo = msg.match(/\d+/);
  if (minimo && msg.includes("caracter"))
    return `Mínimo ${minimo[0]} caracteres`;
  if (
    msg.includes("incorrect") ||
    msg.includes("inválid") ||
    msg.includes("invalid")
  )
    return "Contraseña incorrecta";
  return mensaje.length > 32 ? "Contraseña no válida" : mensaje;
}

/** Separa las validaciones de correo y contraseña para mostrarlas dentro de cada input. */
export function validarPorCampo(
  email: string,
  password: string,
): {
  emailError: string;
  passwordError: string;
} {
  let emailError = "";
  let passwordError = "";

  const general = validateCredentials(email, password);
  if (!general) {
    return { emailError: "", passwordError: "" };
  }

  const msg = general.toLowerCase();
  const esDeCorreo =
    msg.includes("correo") ||
    msg.includes("email") ||
    msg.includes("@") ||
    msg.includes("institucional");
  const esDePassword =
    msg.includes("contraseña") ||
    msg.includes("password") ||
    msg.includes("clave") ||
    msg.includes("caracter");

  if (esDeCorreo) {
    emailError = general;
    const soloPass = validateCredentials("usuario@campus.edu.mx", password);
    if (soloPass) passwordError = soloPass;
  } else if (esDePassword) {
    passwordError = general;
  } else {
    emailError = general;
  }

  return { emailError, passwordError };
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
      entradaCard.value = 1;
      return;
    }
    entradaCard.value = withDelay(
      110,
      withTiming(1, {
        duration: 600,
        easing: CURVA_SUAVE,
      }),
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

/**
 * Enlace de texto blanco que va debajo de la card. * y solo la acción (en semibold) responde al toque y al hover.
edium) responde al toque y al hover.
 */
export function EnlaceCristal({
  prefijo,
  texto,
  onPress,
}: {
  prefijo?: string;
  texto: string;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <View style={styles.enlaceFila}>
      {prefijo ? <Text style={styles.olvidoTexto}>{prefijo} </Text> : null}
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
      progreso.value = 1;
      return;
    }
    progreso.value = withDelay(
      60,
      withTiming(1, {
        duration: 850,
        easing: CURVA_SUAVE,
      }),
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
 * El mensaje de error en rojo se superpone al texto y solo desaparece
 * (con un desvanecido suave) cuando el usuario empieza a escribir.
 * El valor nunca se borra: al escribir se continúa sobre lo que ya había.
 */
export function CampoCristal({
  icon,
  accion,
  error,
  ...inputProps
}: TextInputProps & {
  icon: ReactNode;
  accion?: ReactNode;
  error?: string;
}) {
  const hayError = Boolean(error);
  // En iOS una vista con opacidad 0 no recibe toques: mientras se ve el error, el input
  // queda invisible y no se podría enfocar. Por eso todo el campo enfoca el input al tocarlo.
  const inputRef = useRef<TextInputInstance>(null);

  // Opacidad del texto real: se oculta rápido al aparecer el error
  // y regresa suavemente mientras el error se desvanece.
  const visibilidadTexto = useSharedValue(hayError ? 0 : 1);

  useEffect(() => {
    visibilidadTexto.value = withTiming(hayError ? 0 : 1, {
      duration: hayError ? 140 : 280,
      easing: CURVA_SUAVE,
    });
  }, [hayError, visibilidadTexto]);

  const estiloTexto = useAnimatedStyle(() => ({
    opacity: visibilidadTexto.value,
  }));

  return (
    <Pressable
      accessible={false}
      onPress={() => inputRef.current?.focus()}
      style={styles.campo}
    >
      <View style={styles.campoFila}>
        {icon}
        <View style={styles.campoZonaTexto}>
          <Animated.View style={[styles.campoCapaTexto, estiloTexto]}>
            <TextInput
              ref={inputRef}
              placeholderTextColor={TINTA_TENUE}
              selectionColor={BLANCO}
              style={styles.campoTexto}
              {...inputProps}
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
  formulario: { gap: 14 },

  // Botón píldora blanca
  boton: {
    height: 46,
    marginTop: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLANCO,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    includeFontPadding: false,
    textAlign: "center",
    color: TINTA_OSCURA,
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
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 28,
    backgroundColor: "#ffffff2e",
  },
  tarjetaSolida: { backgroundColor: "rgba(30, 35, 45, 0.95)" },

  // Campos de altura fija con texto de error rojo sin cambiar el borde
  campo: {
    justifyContent: "center",
    height: 53,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#ffffff1e",
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
    color: BLANCO,
    ...SOMBRA_TEXTO,
  },
  campoTextoError: {
    includeFontPadding: false,
    fontFamily: "Inter_500Medium",
    fontSize: 13.5,
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
});
