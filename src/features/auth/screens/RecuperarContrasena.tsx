import { useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";

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
  PantallaCurva,
  TINTA_TENUE,
} from "../components/authStyles";

/** Imagen de la carta del centro: se puede cambiar reemplazando este archivo. */
const IMAGEN_CARTA = require("@/assets/images/auth/clay.png");

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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <PantallaCurva
      titulo="¿Olvidaste tu contraseña?"
      descripcion="Ingresa tu correo electrónico para enviarte un enlace de recuperación de contraseña."
      imagen={IMAGEN_CARTA}
      imagenLabel="Carta de correo"
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
        onQuitarError={() => setError("")}
        estiloCampo={estilosCristal.campoClaro}
      />

      <PressableScale
        scaleTo={0.97}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        onPress={handleSendReset}
        style={[
          estilosCristal.boton,
          estilosCristal.botonAlto,
          estilosCristal.botonCerca,
          loading && estilosCristal.botonDeshabilitado,
        ]}
      >
        <Text style={estilosCristal.botonTexto}>
          {loading ? "Enviando..." : "Enviar enlace"}
        </Text>
      </PressableScale>

      {sent ? (
        <Animated.Text
          entering={FadeIn.duration(520)}
          style={estilosCristal.aviso}
        >
          ¡Correo enviado! Revisa tu bandeja de entrada o spam.
        </Animated.Text>
      ) : null}

      <EnlaceCristal
        oscuro
        prefijo="¿Recordaste tu contraseña?"
        texto="Inicia sesión"
        onPress={onNavigateLogin}
      />
    </PantallaCurva>
  );
}
