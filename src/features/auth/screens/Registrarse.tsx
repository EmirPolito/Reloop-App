import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { SheetLegal } from "@/features/legal/SheetLegal";
import {
  POLITICA_PRIVACIDAD,
  TERMINOS_CONDICIONES,
} from "@/features/legal/textosLegales";
import { IconoCheck } from "@/features/perfil/Perfiliconos";
import { MAX_NOMBRE } from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import { validateCredentials } from "@/utils/validation";
import { useAuth } from "../AuthProvider";
import { mensajeDeError } from "../authService";
import { AuthCarouselLayout } from "../components/AuthCarouselLayout";
import {
  AuthEmailForm,
  AuthTextField,
  EmailField,
  PasswordField,
} from "../components/AuthFields";
import { REGISTER_VARIANT } from "../components/authVariants";
import { REGISTER_SLIDES } from "../slides";

/** Azul de los enlaces legales (el de marca) */
const AZUL_ENLACE = "#202020ff";
/** Rojo suave: borde de la casilla y enlaces cuando se intenta registrar sin aceptar */
const ROJO_ERROR = "#ff5858ff";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  /** true si ya aceptó; si no, marca la leyenda en rojo */
  const exigirAceptacion = () => {
    if (aceptoTodo) return true;
    setIntentoSinAceptar(true);
    return false;
  };

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
    if (!exigirAceptacion()) {
      setError(
        "Acepta la Política de privacidad y los Términos y condiciones para crear la cuenta.",
      );
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
    <>
      <AuthCarouselLayout
        slides={REGISTER_SLIDES}
        variant={REGISTER_VARIANT}
        paused={Boolean(name || email || password)}
        footerPrompt="¿Ya tienes una cuenta?"
        footerAction="Inicia sesión"
        onFooterPress={onNavigateLogin}
        afterFooter={
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
        }
      >
        <AuthEmailForm
          error={error}
          submitLabel={loading ? "Creando cuenta..." : "Crear cuenta"}
          loading={loading}
          onSubmit={handleSubmit}
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
      </AuthCarouselLayout>

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
 * Casilla de aceptación: blanca con borde gris; marcada, oscura con la palomita blanca.
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
      {marcada ? <IconoCheck size={12} color="#FFFFFF" /> : null}
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
  /** En rojo suave junto con la casilla: se intentó registrar sin aceptar */
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
    paddingHorizontal: 8,
    marginTop: 12.5,
  },
  casilla: {
    width: 16,
    height: 16,
    marginRight: 7,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#d9d9d9ff",
    backgroundColor: "#ffffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  casillaError: {
    borderColor: ROJO_ERROR,
  },
  casillaMarcada: {
    backgroundColor: AZUL_ENLACE,
    borderColor: AZUL_ENLACE,
  },
  leyendaTexto: {
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    lineHeight: 21,
    color: "#838383ff",
  },
  enlace: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    lineHeight: 23.5,
    color: AZUL_ENLACE,
  },
  enlaceError: {
    color: ROJO_ERROR,
  },
});
