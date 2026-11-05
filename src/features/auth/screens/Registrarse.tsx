import { useState } from "react";

import { MAX_NOMBRE } from "@/features/perfil/Perfiltemas";
import { showAlert } from "@/utils/alerts";
import { validateCredentials } from "@/utils/validation";
import { mensajeDeError } from "../authService";
import { useAuth } from "../AuthProvider";
import { AuthCarouselLayout } from "../components/AuthCarouselLayout";
import {
  AuthEmailForm,
  AuthTextField,
  EmailField,
  PasswordField,
} from "../components/AuthFields";
import { AuthSocialButtons } from "../components/AuthSocialButtons";
import { REGISTER_VARIANT } from "../components/authVariants";
import { REGISTER_SLIDES } from "../slides";

export function RegistrarsePage({
  email,
  onChangeEmail,
  password,
  onChangePassword,
  onNavigateLogin,
}: {
  email: string;
  onChangeEmail: (email: string) => void;
  password: string;
  onChangePassword: (password: string) => void;
  onNavigateLogin: () => void;
}) {
  const { signUp } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Escribe tu nombre para crear la cuenta.");
      return;
    }
    if (name.trim().length > MAX_NOMBRE) {
      setError(`El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`);
      return;
    }
    const message = validateCredentials(email, password);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCarouselLayout
      slides={REGISTER_SLIDES}
      variant={REGISTER_VARIANT}
      paused={showEmailForm}
      footerPrompt="¿Ya tienes una cuenta?"
      footerAction="Inicia sesión"
      onFooterPress={onNavigateLogin}
    >
      {showEmailForm ? (
        <AuthEmailForm
          error={error}
          submitLabel={loading ? "Creando cuenta..." : "Crear cuenta"}
          loading={loading}
          onSubmit={handleSubmit}
          onBack={() => setShowEmailForm(false)}
        >
          <AuthTextField
            accessibilityLabel="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            autoCapitalize="words"
          />
          <EmailField value={email} onChangeText={onChangeEmail} />
          <PasswordField
            value={password}
            onChangeText={onChangePassword}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </AuthEmailForm>
      ) : (
        <AuthSocialButtons
          onEmailPress={() => setShowEmailForm(true)}
          onProviderPress={(provider) =>
            showAlert(
              provider,
              "Este método de registro estará disponible próximamente.",
            )
          }
        />
      )}
    </AuthCarouselLayout>
  );
}
