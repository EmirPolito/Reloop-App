import { useState } from "react";
import { View } from "react-native";

import { Text } from "@/features/shared/Text";
import { showAlert } from "@/utils/alerts";
import { isValidEmail } from "@/utils/validation";
import { mensajeDeError } from "../authService";
import { useAuth } from "../AuthProvider";
import { AuthCarouselLayout } from "../components/AuthCarouselLayout";
import { AuthButton, EmailField } from "../components/AuthFields";
import { authStyles } from "../components/authStyles";
import { LOGIN_VARIANT } from "../components/authVariants";
import { RECOVERY_SLIDES } from "../slides";

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

  async function handleSendReset() {
    const correo = email.trim();
    if (!isValidEmail(correo)) {
      setError("Escribe un correo electrónico válido.");
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
    <AuthCarouselLayout
      slides={RECOVERY_SLIDES}
      variant={LOGIN_VARIANT}
      paused
      footerPrompt="¿Recordaste tu contraseña?"
      footerAction="Inicia sesión"
      onFooterPress={onNavigateLogin}
    >
      <View style={authStyles.emailFormContainer}>
        <EmailField
          value={email}
          onChangeText={(text) => {
            setSent(false);
            onChangeEmail(text);
          }}
        />

        {error ? <Text style={authStyles.authError}>{error}</Text> : null}
        {sent ? (
          <Text style={authStyles.authNotice}>
            ¡Correo enviado! Revisa tu bandeja de entrada o spam.
          </Text>
        ) : null}

        <AuthButton
          label={loading ? "Enviando..." : "Enviar enlace"}
          onPress={handleSendReset}
          disabled={loading}
        />
      </View>
    </AuthCarouselLayout>
  );
}
