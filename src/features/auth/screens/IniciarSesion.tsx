import { useState } from "react";
import { Pressable, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/features/shared/Text";
import { useAuth } from "../AuthProvider";
import { campoDeError, mensajeDeError } from "../authService";
import { EyeIcon, LockFilledIcon, MessageIcon } from "../components/AuthIcons";
import {
  CampoCristal,
  EnlaceCristal,
  estilosCristal,
  PantallaCristal,
  TINTA_TENUE,
  validarPorCampo,
  type TarjetaAbanico,
} from "../components/PantallaCristal";

/**
 * Imágenes de las 3 tarjetas en abanico de inicio de sesión (izquierda, centro, derecha).
 * Por ahora son las mismas que en la otra pantalla; se pueden cambiar aquí sin afectarla.
 */
const TARJETAS_LOGIN: [TarjetaAbanico, TarjetaAbanico, TarjetaAbanico] = [
  { source: require("@/assets/images/auth/fondo.jpeg"), position: "left top" },
  { source: require("@/assets/images/auth/fondo.jpeg"), position: "center" },
  {
    source: require("@/assets/images/auth/fondo.jpeg"),
    position: "right bottom",
  },
];

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

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  function handleEmailChange(valor: string) {
    if (emailError) setEmailError("");
    onChangeEmail(valor);
  }

  function handlePasswordChange(valor: string) {
    if (passwordError) setPasswordError("");
    onChangePassword(valor);
  }

  async function handleSubmit() {
    const { emailError: errCorreo, passwordError: errPass } = validarPorCampo(
      email,
      password,
    );
    if (errCorreo || errPass) {
      setEmailError(errCorreo);
      setPasswordError(errPass);
      return;
    }

    setEmailError("");
    setPasswordError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      const msg = mensajeDeError(e);
      if (campoDeError(e) === "correo") setEmailError(msg);
      else setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PantallaCristal
      titulo="Bienvenido de nuevo"
      tarjetas={TARJETAS_LOGIN}
      // subtitulo="Todo lo que buscas en un solo lugar."
      pie={
        <>
          <EnlaceCristal
            texto="¿Olvidaste tu contraseña?"
            onPress={onNavigateRecovery}
          />
          <EnlaceCristal
            prefijo="¿No tienes una cuenta?"
            texto="Regístrate"
            onPress={onNavigateRegister}
          />
        </>
      }
    >
      <View style={estilosCristal.formulario}>
        <CampoCristal
          icon={<MessageIcon color={TINTA_TENUE} />}
          accessibilityLabel="Correo electrónico"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          error={emailError}
        />
        <CampoCristal
          icon={<LockFilledIcon color={TINTA_TENUE} />}
          accessibilityLabel="Contraseña"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Contraseña"
          secureTextEntry={!verPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          error={passwordError}
          accion={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                verPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              onPress={() => setVerPassword((actual) => !actual)}
              hitSlop={12}
            >
              <EyeIcon off={verPassword} color={TINTA_TENUE} />
            </Pressable>
          }
        />
      </View>

      <PressableScale
        scaleTo={0.97}
        disabled={loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading }}
        onPress={handleSubmit}
        style={[
          estilosCristal.boton,
          loading && estilosCristal.botonDeshabilitado,
        ]}
      >
        <Text style={estilosCristal.botonTexto}>
          {loading ? "Entrando..." : "Continuar"}
        </Text>
      </PressableScale>
    </PantallaCristal>
  );
}
