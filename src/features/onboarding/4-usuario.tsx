import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useUsernameDisponible } from "@/features/perfil/hooks/useUsernameDisponible";
import {
  MAX_USERNAME,
  normalizarUsername,
} from "@/features/perfil/nombreUsuario";
import {
  UsernameError,
  claimUsername,
} from "@/features/perfil/repositorioUsername";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { BotonPaso } from "./components/BotonPaso";
import { puedeFinalizar } from "./reglasOnboarding";
import { LETRA, coloresOnboarding } from "./temaOnboarding";

const VERDE = "#4CD694";
const ROJO = "#FF7A7A";
/** Lado del indicador de la derecha (carga o resultado) */
const LADO_ESTADO = 34;

/**
 * Último paso: el @usuario que se asignó solo, grande y centrado. Se toca para escribir otro;
 * a la derecha aparece un indicador de carga mientras se revisa y después un círculo verde
 * con palomita (está libre) o rojo (no sirve). Se guarda al terminar, con el botón, y tocar
 * fuera del campo baja el teclado.
 */
export function PasoUsuario({
  username,
  isDark,
  onFinalizar,
}: {
  username: string | null;
  isDark: boolean;
  /** Termina la configuración; si falla lanza (y ya avisó) */
  onFinalizar: () => Promise<void>;
}) {
  const c = coloresOnboarding(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const { uid } = useSessionUser();
  const [texto, setTexto] = useState(username ?? "");
  const [trabajando, setTrabajando] = useState(false);
  const disponibilidad = useUsernameDisponible(texto, username, uid);
  const nuevo = normalizarUsername(texto);

  const sinCambios = disponibilidad.estado === "sinCambios";
  const listo = sinCambios
    ? puedeFinalizar(username)
    : disponibilidad.estado === "disponible";

  const aviso =
    disponibilidad.estado === "invalido"
      ? disponibilidad.mensaje
      : disponibilidad.estado === "ocupado"
        ? `@${nuevo} ya está en uso`
        : disponibilidad.estado === "error"
          ? "No se pudo revisar, intenta de nuevo"
          : null;

  const finalizar = async () => {
    if (trabajando || !listo) return;
    setTrabajando(true);
    try {
      if (!sinCambios) {
        try {
          await claimUsername(uid, nuevo);
        } catch (error) {
          if (error instanceof UsernameError) {
            showAlert("No se pudo cambiar tu usuario", error.message);
          } else {
            showErrorAlert("No se pudo cambiar tu usuario", error);
          }
          return;
        }
      }
      Keyboard.dismiss();
      await onFinalizar();
    } catch {
      // Ya se avisó; se queda para reintentar
    } finally {
      setTrabajando(false);
    }
  };

  /** Lo que va a la derecha del usuario según en qué punto está */
  const estado =
    disponibilidad.estado === "verificando" ? (
      <View style={styles.estado}>
        <ActivityIndicator
          size="small"
          color={c.suave}
          accessibilityLabel="Revisando si está disponible"
        />
      </View>
    ) : disponibilidad.estado === "disponible" ? (
      <View
        accessible
        accessibilityLabel={`@${nuevo} está disponible`}
        style={[styles.estado, styles.circulo, { backgroundColor: VERDE }]}
      >
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      </View>
    ) : sinCambios ? (
      // Sin cambios no hay nada que mostrar: el lugar queda libre para que el texto no salte
      <View style={styles.estado} />
    ) : (
      <View
        accessible
        accessibilityLabel="Este usuario no se puede usar"
        style={[styles.estado, styles.circulo, { backgroundColor: ROJO }]}
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </View>
    );

  return (
    // Tocar fuera del campo y del botón baja el teclado
    <Pressable
      accessible={false}
      onPress={Keyboard.dismiss}
      style={styles.paso}
    >
      <View style={styles.centro}>
        <View>
          <View style={styles.fila}>
            <Text style={[LETRA.bold, styles.arroba, { color: c.suave }]}>
              @
            </Text>
            <TextInput
              {...teclado}
              value={texto}
              // Se muestra ya normalizado: así se ve exactamente lo que se guardará
              onChangeText={(v) => setTexto(normalizarUsername(v))}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              maxLength={MAX_USERNAME}
              placeholder="usuario"
              placeholderTextColor={c.suave}
              selectionColor={c.texto}
              cursorColor={c.texto}
              underlineColorAndroid="transparent"
              returnKeyType="done"
              onSubmitEditing={() => void finalizar()}
              accessibilityLabel="Usuario"
              style={[LETRA.bold, styles.input, { color: c.texto }]}
            />
            {estado}
          </View>
          <View style={[styles.linea, { backgroundColor: c.divisor }]} />
        </View>

        {aviso ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[LETRA.regular, styles.aviso, { color: c.error }]}
          >
            {aviso}
          </Text>
        ) : null}
      </View>

      <BotonPaso
        texto={listo ? "Finalizar" : "Elige un usuario disponible"}
        isDark={isDark}
        cargando={trabajando}
        deshabilitado={!listo}
        onPress={() => void finalizar()}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  paso: { flex: 1, paddingHorizontal: 17, paddingTop: 4 },
  centro: { flex: 1, justifyContent: "center", gap: 16, paddingBottom: 43 },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  arroba: { fontSize: 30, lineHeight: 38 },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.6,
    paddingVertical: 0,
    textAlign: "center",
  },
  estado: {
    width: LADO_ESTADO,
    height: LADO_ESTADO,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: { borderRadius: LADO_ESTADO / 2 },
  linea: { height: 1.5, marginTop: 6 },
  aviso: { fontSize: 12.5, textAlign: "center" },
});
