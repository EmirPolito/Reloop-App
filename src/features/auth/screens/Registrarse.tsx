import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { SheetLegal } from "@/features/legal/SheetLegal";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_CONDICIONES,
} from "@/features/legal/textosLegales";
import { IconoCheck } from "@/features/perfil/Perfiliconos";
import { MAX_NOMBRE } from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import { useAuth } from "../AuthProvider";
import { campoDeError, mensajeDeError } from "../authService";
import {
  EyeIcon,
  FaceIcon,
  LockFilledIcon,
  MessageIcon,
} from "../components/AuthIcons";
import {
  BLANCO,
  CampoCristal,
  EnlaceCristal,
  estilosCristal,
  PantallaCristal,
  ROJO_ERROR,
  SOMBRA_TEXTO,
  TINTA_TENUE,
  validarPorCampo,
  type TarjetaAbanico,
} from "../components/PantallaCristal";

/**
 * Imágenes de las 3 tarjetas en abanico de registro (izquierda, centro, derecha).
 * Por ahora son las mismas que en la otra pantalla; se pueden cambiar aquí sin afectarla.
 */
const TARJETAS_REGISTRO: [TarjetaAbanico, TarjetaAbanico, TarjetaAbanico] = [
  { source: require("@/assets/images/auth/fondo.jpeg"), position: "left top" },
  { source: require("@/assets/images/auth/fondo.jpeg"), position: "center" },
  {
    source: require("@/assets/images/auth/fondo.jpeg"),
    position: "right bottom",
  },
];

type DocumentoLegal = "privacidad" | "terminos";

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
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  // Leyenda legal
  const [legal, setLegal] = useState<DocumentoLegal | null>(null);
  const [aceptados, setAceptados] = useState({
    privacidad: false,
    terminos: false,
  });
  const aceptoTodo = aceptados.privacidad && aceptados.terminos;
  // Se activa al intentar registrarse sin aceptar: la casilla se marca en rojo hasta que se acepte
  const [intentoSinAceptar, setIntentoSinAceptar] = useState(false);
  const casillaError = intentoSinAceptar && !aceptoTodo;

  const marcarTodo = () => {
    const valor = !aceptoTodo;
    setAceptados({ privacidad: valor, terminos: valor });
  };

  const aceptar = (documento: DocumentoLegal) =>
    setAceptados((actual) => ({ ...actual, [documento]: true }));

  function handleNameChange(valor: string) {
    if (nameError) setNameError("");
    setName(valor);
  }

  function handleEmailChange(valor: string) {
    if (emailError) setEmailError("");
    onChangeEmail(valor);
  }

  function handlePasswordChange(valor: string) {
    if (passwordError) setPasswordError("");
    onChangePassword(valor);
  }

  async function handleSubmit() {
    const errNombre = !name.trim()
      ? "Ingresa tu nombre"
      : name.trim().length > MAX_NOMBRE
        ? `Máximo ${MAX_NOMBRE} caracteres`
        : "";
    const { emailError: errCorreo, passwordError: errPass } = validarPorCampo(
      email,
      password,
    );
    if (!aceptoTodo) setIntentoSinAceptar(true);
    if (errNombre || errCorreo || errPass || !aceptoTodo) {
      setNameError(errNombre);
      setEmailError(errCorreo);
      setPasswordError(errPass);
      return;
    }

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setLoading(true);
    try {
      await signUp(name, email, password);
    } catch (e) {
      const msg = mensajeDeError(e);
      if (campoDeError(e) === "correo") setEmailError(msg);
      else setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PantallaCristal
        titulo="Crea tu cuenta"
        tarjetas={TARJETAS_REGISTRO}
        // subtitulo="Compra, intercambia y más dentro de tu campus."
        pie={
          <EnlaceCristal
            prefijo="¿Ya tienes una cuenta?"
            texto="Inicia sesión"
            onPress={onNavigateLogin}
          />
        }
      >
        <View style={estilosCristal.formulario}>
          <CampoCristal
            icon={<FaceIcon color={TINTA_TENUE} />}
            accessibilityLabel="Nombre"
            value={name}
            onChangeText={handleNameChange}
            placeholder="Tu nombre"
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            error={nameError}
          />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry={!verPassword}
            autoCapitalize="none"
            autoComplete="new-password"
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

        <View style={styles.leyenda}>
          <Casilla
            marcada={aceptoTodo}
            error={casillaError}
            onPress={marcarTodo}
          />
          <Text style={styles.leyendaTexto}>Acepto la </Text>
          <EnlaceLegal
            texto="Política de privacidad"
            error={casillaError}
            onPress={() => setLegal("privacidad")}
          />
          <Text style={styles.leyendaTexto}> y los </Text>
          <EnlaceLegal
            texto="Términos y condiciones"
            error={casillaError}
            onPress={() => setLegal("terminos")}
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
            styles.boton,
            loading && estilosCristal.botonDeshabilitado,
          ]}
        >
          <Text style={estilosCristal.botonTexto}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </PressableScale>
      </PantallaCristal>

      {/* Los drawers legales van en tema claro, igual que antes en la splash */}
      <SheetLegal
        documento={POLITICA_PRIVACIDAD}
        visible={legal === "privacidad"}
        isDark={false}
        onClose={() => setLegal(null)}
        onAceptar={() => aceptar("privacidad")}
      />
      <SheetLegal
        documento={TERMINOS_CONDICIONES}
        visible={legal === "terminos"}
        isDark={false}
        onClose={() => setLegal(null)}
        onAceptar={() => aceptar("terminos")}
      />
    </>
  );
}

/**
 * Casilla de aceptación translúcida con borde blanco; marcada, blanca con la palomita oscura.
 * Es propia (no la de HeroUI) para controlar colores y tamaño igual en Android, iOS y web.
 */
function Casilla({
  marcada,
  error = false,
  onPress,
}: {
  marcada: boolean;
  /** Borde rojo: se intentó registrar sin aceptar */
  error?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel="Acepto la Política de privacidad y los Términos y condiciones"
      accessibilityHint={
        error ? "Marca la casilla para poder crear la cuenta" : undefined
      }
      hitSlop={10}
      onPress={onPress}
      style={[
        styles.casilla,
        error && styles.casillaError,
        marcada && styles.casillaMarcada,
      ]}
    >
      {marcada ? <IconoCheck size={12} color="#18181B" /> : null}
    </Pressable>
  );
}

/**
 * Enlace dentro de la leyenda legal. Sustituye a `LinkButton` de HeroUI: su `Button` base
 * calcula un color de resaltado del tema que en web no se puede leer y llena la consola
 * de errores, aunque el resaltado esté desactivado.
 */
function EnlaceLegal({
  texto,
  error = false,
  onPress,
}: {
  texto: string;
  /** En rojo junto con la casilla: se intentó registrar sin aceptar */
  error?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={texto}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.6 }}
    >
      <Text style={[styles.enlace, error && styles.enlaceError]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Casilla y texto en una sola línea que se parte si no cabe; cada línea queda centrada
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 16,
  },
  casilla: {
    width: 16,
    height: 16,
    marginRight: 7,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  casillaError: {
    borderColor: ROJO_ERROR,
  },
  casillaMarcada: {
    backgroundColor: BLANCO,
    borderColor: BLANCO,
  },
  leyendaTexto: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 21,
    color: "#ffffffeb",
    ...SOMBRA_TEXTO,
  },
  enlace: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    lineHeight: 20,
    color: BLANCO,
    ...SOMBRA_TEXTO,
  },
  enlaceError: {
    color: "#e13b3bff",
  },
  boton: { marginTop: 16 },
});
