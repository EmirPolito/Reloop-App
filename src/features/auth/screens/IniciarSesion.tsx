import { useState } from "react";
import { Pressable } from "react-native";

import { Text } from "@/features/shared/Text";
import { showAlert } from "@/utils/alerts";
import { validateCredentials } from "@/utils/validation";
import { mensajeDeError } from "../authService";
import { useAuth } from "../AuthProvider";
import { AuthCarouselLayout } from "../components/AuthCarouselLayout";
import {
  AuthEmailForm,
  EmailField,
  PasswordField,
} from "../components/AuthFields";
import { AuthSocialButtons } from "../components/AuthSocialButtons";
import { authStyles } from "../components/authStyles";
import { LOGIN_VARIANT } from "../components/authVariants";
import { LOGIN_SLIDES } from "../slides";

export function IniciarSesionPage({
  email,
  onChangeEmail,
  password,
  onChangePassword,
  onNavigateRegister,
  onNavigateRecovery,
}: {
  email: string;
  onChangeEmail: (email: string) => void;
  password: string;
  onChangePassword: (password: string) => void;
  onNavigateRegister: () => void;
  onNavigateRecovery: () => void;
}) {
  const { signIn } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const message = validateCredentials(email, password);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCarouselLayout
      slides={LOGIN_SLIDES}
      variant={LOGIN_VARIANT}
      paused={showEmailForm}
      footerPrompt="¿No tienes una cuenta?"
      footerAction="Regístrate"
      onFooterPress={onNavigateRegister}
    >
      {showEmailForm ? (
        <AuthEmailForm
          error={error}
          submitLabel={loading ? "Entrando..." : "Iniciar sesión"}
          loading={loading}
          onSubmit={handleSubmit}
          onBack={() => setShowEmailForm(false)}
        >
          <EmailField value={email} onChangeText={onChangeEmail} />
          <PasswordField
            value={password}
            onChangeText={onChangePassword}
            placeholder="Contraseña"
            autoComplete="current-password"
          />
          <Pressable
            accessibilityRole="link"
            onPress={onNavigateRecovery}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={authStyles.forgotPassword}
          >
            <Text style={authStyles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>
        </AuthEmailForm>
      ) : (
        <AuthSocialButtons
          onEmailPress={() => setShowEmailForm(true)}
          onProviderPress={(provider) =>
            showAlert(
              provider,
              "Este método de acceso estará disponible próximamente.",
            )
          }
        />
      )}
    </AuthCarouselLayout>
  );
}
