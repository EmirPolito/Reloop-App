import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { Text } from "@/features/shared/Text";
import { PressableScale } from "@/components/PressableScale";
import { mensajeDeError } from "../authService";
import { useAuth } from "../AuthProvider";
import {
  EnlaceCristal,
  estilosCristal,
  PantallaCurva,
} from "../components/authStyles";

/** Imagen del centro: la misma carta de Recuperar contraseña. */
const IMAGEN_CARTA = require("@/assets/images/auth/clay.png");

/** Segundos que hay que esperar entre un reenvío del correo y el siguiente. */
const RESEND_COOLDOWN_SECONDS = 30;
/** Cada cuánto se comprueba en silencio si ya se abrió el enlace del correo. */
const POLL_MS = 5000;

/**
 * Pantalla para quien tiene cuenta pero aún no verificó su correo. Se comprueba sola cada
 * pocos segundos y al volver a la app (no hace falta un botón para comprobarlo): basta con
 * abrir el enlace del correo y regresar.
 */
export function VerificarCorreoPage() {
  const { user, resendVerification, checkVerification, signOut } = useAuth();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const email = user?.email ?? null;

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
    <PantallaCurva
      titulo="Verifica tu correo"
      descripcion={`Enviamos un enlace a ${email ?? "tu correo"}. Ábrelo y vuelve aquí: entrarás automáticamente. Si no lo ves, revisa el spam.`}
      imagen={IMAGEN_CARTA}
      imagenLabel="Carta de correo"
    >
      <PressableScale
        scaleTo={0.97}
        disabled={secondsLeft > 0}
        accessibilityRole="button"
        accessibilityState={{ disabled: secondsLeft > 0 }}
        onPress={handleResend}
        style={[
          estilosCristal.boton,
          estilosCristal.botonAlto,
          estilosCristal.botonPrimero,
          estilosCristal.botonSecundario,
          secondsLeft > 0 && estilosCristal.botonDeshabilitado,
        ]}
      >
        <Text
          style={[
            estilosCristal.botonTexto,
            estilosCristal.botonSecundarioTexto,
          ]}
        >
          {secondsLeft > 0
            ? `Reenviar correo (${secondsLeft} s)`
            : "Reenviar correo"}
        </Text>
      </PressableScale>

      {error ? (
        <Text style={[estilosCristal.aviso, estilosCristal.avisoError]}>
          {error}
        </Text>
      ) : null}
      {notice ? <Text style={estilosCristal.aviso}>{notice}</Text> : null}

      <EnlaceCristal
        oscuro
        prefijo="¿Te equivocaste de correo?"
        texto="Cerrar sesión"
        onPress={() => {
          signOut().catch((e) =>
            console.warn("No se pudo cerrar la sesión.", e),
          );
        }}
      />
    </PantallaCurva>
  );
}
