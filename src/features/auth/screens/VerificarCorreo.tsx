import { useEffect, useMemo, useState } from "react";
import { AppState, View } from "react-native";

import { Text } from "@/features/shared/Text";
import { mensajeDeError } from "../authService";
import { useAuth } from "../AuthProvider";
import { AuthCarouselLayout } from "../components/AuthCarouselLayout";
import { AuthButton } from "../components/AuthFields";
import { authStyles } from "../components/authStyles";
import { LOGIN_VARIANT } from "../components/authVariants";
import { verifySlides } from "../slides";

/** Segundos que hay que esperar entre un reenvío del correo y el siguiente. */
const RESEND_COOLDOWN_SECONDS = 30;
/** Cada cuánto se comprueba en silencio si ya se abrió el enlace del correo. */
const POLL_MS = 5000;

/**
 * Pantalla para quien tiene cuenta pero aún no verificó su correo. Se comprueba sola cada
 * pocos segundos y al volver a la app, así que basta con abrir el enlace del correo y regresar.
 */
export function VerificarCorreoPage() {
  const { user, resendVerification, checkVerification, signOut } = useAuth();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const email = user?.email ?? null;
  const slides = useMemo(() => verifySlides(email), [email]);

  useEffect(() => {
    const ignoreFailure = () => {};
    const poll = setInterval(() => {
      checkVerification().catch(ignoreFailure);
    }, POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") checkVerification().catch(ignoreFailure);
    });
    return () => {
      clearInterval(poll);
      clearInterval(clock);
      appState.remove();
    };
  }, [checkVerification]);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function handleCheck() {
    setChecking(true);
    setError("");
    setNotice("");
    try {
      const verified = await checkVerification();
      if (!verified) {
        setError(
          "Todavía no aparece como verificado. Abre el enlace del correo y vuelve a intentarlo.",
        );
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    setError("");
    setNotice("");
    try {
      await resendVerification();
      const sentAt = Date.now();
      setNow(sentAt);
      setResendAt(sentAt + RESEND_COOLDOWN_SECONDS * 1000);
      setNotice("Te enviamos otro correo. Revisa también la carpeta de spam.");
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  return (
    <AuthCarouselLayout
      slides={slides}
      variant={LOGIN_VARIANT}
      paused
      footerPrompt="¿Te equivocaste de correo?"
      footerAction="Cerrar sesión"
      onFooterPress={() => {
        signOut().catch((e) => console.warn("No se pudo cerrar la sesión.", e));
      }}
    >
      <View style={authStyles.emailFormContainer}>
        {error ? <Text style={authStyles.authError}>{error}</Text> : null}
        {notice ? <Text style={authStyles.authNotice}>{notice}</Text> : null}

        <AuthButton
          label={checking ? "Comprobando..." : "Ya verifiqué mi correo"}
          onPress={handleCheck}
          disabled={checking}
        />
        <AuthButton
          variant="secondary"
          label={
            secondsLeft > 0
              ? `Reenviar correo (${secondsLeft} s)`
              : "Reenviar correo"
          }
          onPress={handleResend}
          disabled={secondsLeft > 0}
        />
      </View>
    </AuthCarouselLayout>
  );
}
