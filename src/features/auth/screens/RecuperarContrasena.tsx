import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/features/shared/Text";
import { showAlert } from "@/utils/alerts";
import { isValidEmail } from "@/utils/validation";
import { useAuth } from "../AuthProvider";
import { mensajeDeError } from "../authService";
import { MessageIcon } from "../components/AuthIcons";
import {
  CampoCristal,
  EnlaceCristal,
  estilosCristal,
  TINTA_TENUE,
} from "../components/PantallaCristal";

/** Color de la parte de arriba. */
const COLOR_FONDO = "#181818ff";

/** Logo de hasta arriba (el mismo que en Iniciar sesión). */
const LOGO = require("@/assets/images/auth/logo.png");
const LOGO_TAMANO = 78;

/** Imagen de la carta del centro: se puede cambiar reemplazando este archivo. */
const IMAGEN_CARTA = require("@/assets/images/auth/clay.png");
const IMAGEN_CARTA_TAMANO = 145;

const BLANCO = "#FFFFFF";
const ALTO_CURVA = 60;
const CURVA_SUAVE = Easing.bezier(0.22, 1, 0.36, 1);

export function RecuperacionPage({
  email,
  onChangeEmail,
  onNavigateLogin,
}: {
  email: string;
  onChangeEmail: (email: string) => void;
  onNavigateLogin: () => void;
}) {
  const { sendPasswordReset } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sinMovimiento = useReducedMotion();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const aparecer = (delayMs: number) =>
    sinMovimiento
      ? undefined
      : FadeIn.duration(520).delay(delayMs).easing(CURVA_SUAVE);

  function handleEmailChange(valor: string) {
    if (error) setError("");
    setSent(false);
    onChangeEmail(valor);
  }

  async function handleSendReset() {
    const correo = email.trim();
    if (!correo) {
      setError("Ingresa tu correo");
      return;
    }
    if (!isValidEmail(correo)) {
      setError("Correo no válido");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(correo);
      setSent(true);
      showAlert(
        "Enlace enviado",
        `Hemos enviado un correo a ${correo} con instrucciones para restablecer tu contraseña.`,
      );
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Parte de color: título, descripción e imagen ── */}
          <View style={[styles.arriba, { paddingTop: insets.top + 4 }]}>
            {/* Logo hasta arriba */}
            <Animated.View entering={aparecer(0)}>
              <Image
                source={LOGO}
                contentFit="contain"
                transition={0}
                accessibilityLabel="Logo de ReLoop"
                style={styles.logo}
              />
            </Animated.View>

            <View style={styles.espacio} />

            <Animated.View entering={aparecer(60)} style={styles.textos}>
              <Text accessibilityRole="header" style={styles.titulo}>
                ¿Olvidaste tu contraseña?
              </Text>
              <Text style={styles.descripcion}>
                Ingresa tu correo electrónico para enviarte un enlace de
                recuperación de contraseña.
              </Text>
            </Animated.View>

            <Animated.View entering={aparecer(120)}>
              <Image
                source={IMAGEN_CARTA}
                contentFit="contain"
                transition={0}
                accessibilityLabel="Carta de correo"
                style={styles.imagenCarta}
              />
            </Animated.View>
          </View>

          {/* ── Card blanca con borde superior curvo ── */}
          <Animated.View
            entering={
              sinMovimiento
                ? undefined
                : FadeInDown.duration(600).delay(110).easing(CURVA_SUAVE)
            }
            style={[styles.card, { minHeight: height * 0.46 }]}
          >
            <Svg
              width="100%"
              height={ALTO_CURVA}
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              style={styles.curva}
            >
              <Path d="M0 20 Q50 -20 100 20 Z" fill={BLANCO} />
            </Svg>

            <View
              style={[
                styles.cardContenido,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              <CampoCristal
                icon={<MessageIcon color={TINTA_TENUE} />}
                accessibilityLabel="Correo electrónico"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSendReset}
                error={error}
                estiloCampo={styles.campo}
              />

              <PressableScale
                scaleTo={0.97}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
                onPress={handleSendReset}
                style={[
                  estilosCristal.boton,
                  styles.boton,
                  loading && estilosCristal.botonDeshabilitado,
                ]}
              >
                <Text style={estilosCristal.botonTexto}>
                  {loading ? "Enviando..." : "Enviar enlace"}
                </Text>
              </PressableScale>

              {sent ? (
                <Animated.Text entering={aparecer(0)} style={styles.aviso}>
                  ¡Correo enviado! Revisa tu bandeja de entrada o spam.
                </Animated.Text>
              ) : null}

              <EnlaceCristal
                oscuro
                prefijo="¿Recordaste tu contraseña?"
                texto="Inicia sesión"
                onPress={onNavigateLogin}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLOR_FONDO },
  flex: { flex: 1 },
  contenido: { flexGrow: 1 },

  arriba: {
    flex: 1,
    alignItems: "center",
    // Por encima de la card para que la curva blanca no tape la carta
    zIndex: 1,
    gap: 19,
    paddingHorizontal: 20,
    paddingBottom: ALTO_CURVA + -60,
  },

  textos: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    // Separa el título de la carta para que quede un poco más arriba
    marginBottom: 10,
  },

  titulo: {
    fontFamily: "Inter_500Medium",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.8,
    textAlign: "center",
    color: BLANCO,
  },
  descripcion: {
    marginTop: 7,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#ffffffe0",
  },

  espacio: { flex: 1 },

  logo: { width: LOGO_TAMANO, height: LOGO_TAMANO, borderRadius: 19 },
  imagenCarta: {
    width: IMAGEN_CARTA_TAMANO,
    height: IMAGEN_CARTA_TAMANO,
    // Un poco más abajo sin mover la card
    transform: [{ translateY: 12 }],
  },

  card: { backgroundColor: BLANCO },
  curva: { position: "absolute", top: -ALTO_CURVA + 1, left: 0, right: 0 },
  cardContenido: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 40,
  },
  boton: { marginTop: 15 },
  campo: { backgroundColor: "#F2F2F4", borderColor: "#E7E7EA" },
  aviso: {
    marginTop: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    color: TINTA_TENUE,
  },
});
