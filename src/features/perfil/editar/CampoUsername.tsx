import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import {
  useUsernameAvailability,
  type DisponibilidadUsername,
} from "../hooks/useUsernameAvailability";
import { IconoEditar } from "../Perfiliconos";
import { MAX_USERNAME, normalizarUsername } from "../username";
import { UsernameError, claimUsername } from "../usernameRepository";
import { INTER, coloresEditar } from "./editarTema";

const VERDE = "#12915F";
const ROJO = "#FF3B30";

/**
 * @username editable debajo del nombre. A diferencia del nombre, no se guarda al tocar
 * fuera: solo con la palomita, cuando está disponible, y tras confirmar (cambiarlo libera
 * el anterior para otras personas).
 */
export function CampoUsername({
  username,
  isDark,
}: {
  username: string | null;
  isDark: boolean;
}) {
  const c = coloresEditar(isDark);
  const { uid } = useSessionUser();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(username ?? "");
  const [guardando, setGuardando] = useState(false);
  const disponibilidad = useUsernameAvailability(texto, username, uid);
  const nuevo = normalizarUsername(texto);
  const puedeGuardar = disponibilidad.estado === "disponible" && !guardando;

  const empezar = () => {
    setTexto(username ?? "");
    setEditando(true);
  };

  const guardar = () => {
    if (!puedeGuardar) return;
    showAlert(
      `¿Cambiar tu usuario a @${nuevo}?`,
      username
        ? `@${username} quedará libre y otra persona podrá usarlo.`
        : undefined,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cambiar",
          onPress: () => {
            setGuardando(true);
            claimUsername(uid, nuevo)
              .then(() => setEditando(false))
              .catch((error) => {
                if (error instanceof UsernameError) {
                  showAlert("No se pudo cambiar tu usuario", error.message);
                } else {
                  showErrorAlert("No se pudo cambiar tu usuario", error);
                }
              })
              .finally(() => setGuardando(false));
          },
        },
      ],
    );
  };

  if (!editando) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          username ? `Usuario @${username}. Editar usuario` : "Elegir usuario"
        }
        onPress={empezar}
        hitSlop={8}
        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
      >
        <Animated.View entering={FadeIn.duration(160)}>
          <Text style={[INTER.medium, { fontSize: 14, color: c.suave }]}>
            {username ? `@${username}` : "Elige tu @usuario"}
          </Text>
        </Animated.View>
        <IconoEditar size={14} color={c.suave} />
      </Pressable>
    );
  }

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={[INTER.medium, { fontSize: 15, color: c.suave }]}>@</Text>
        <TextInput
          autoFocus
          value={texto}
          // Se muestra ya normalizado: así se ve exactamente lo que se guardará
          onChangeText={(valor) => setTexto(normalizarUsername(valor))}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          spellCheck={false}
          maxLength={MAX_USERNAME}
          returnKeyType="done"
          onSubmitEditing={guardar}
          placeholder="usuario"
          placeholderTextColor={c.suave}
          selectionColor={c.texto}
          cursorColor={c.texto}
          underlineColorAndroid="transparent"
          accessibilityLabel="Usuario"
          accessibilityHint="Solo letras minúsculas, números y guion bajo"
          style={[
            INTER.medium,
            { fontSize: 15, color: c.texto, padding: 0, margin: 0, minWidth: 90 },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          hitSlop={10}
          onPress={() => setEditando(false)}
          disabled={guardando}
        >
          <Animated.View entering={ZoomIn.duration(160)}>
            <Ionicons name="close" size={18} color={c.suave} />
          </Animated.View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Guardar usuario"
          accessibilityState={{ disabled: !puedeGuardar, busy: guardando }}
          hitSlop={10}
          onPress={guardar}
          disabled={!puedeGuardar}
        >
          <Animated.View entering={ZoomIn.duration(160)}>
            {guardando ? (
              <ActivityIndicator size="small" color={c.texto} />
            ) : (
              <Ionicons
                name="checkmark"
                size={19}
                color={puedeGuardar ? c.texto : c.suave}
                style={{ opacity: puedeGuardar ? 1 : 0.45 }}
              />
            )}
          </Animated.View>
        </Pressable>
      </View>

      <Estado disponibilidad={disponibilidad} suave={c.suave} />
    </View>
  );
}

/** Línea de estado bajo el campo; se anuncia al lector de pantalla cuando cambia */
function Estado({
  disponibilidad,
  suave,
}: {
  disponibilidad: DisponibilidadUsername;
  suave: string;
}) {
  const { texto, color } = (() => {
    switch (disponibilidad.estado) {
      case "sinCambios":
        return { texto: "Es tu usuario actual", color: suave };
      case "invalido":
        return { texto: disponibilidad.mensaje, color: ROJO };
      case "verificando":
        return { texto: "Verificando…", color: suave };
      case "disponible":
        return { texto: "Disponible", color: VERDE };
      case "ocupado":
        return { texto: "No disponible", color: ROJO };
      case "error":
        return { texto: "No se pudo verificar. Revisa tu conexión.", color: ROJO };
    }
  })();

  return (
    <Animated.View
      key={disponibilidad.estado}
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(100)}
      accessibilityLiveRegion="polite"
    >
      <Text style={[INTER.regular, { fontSize: 12.5, color }]}>{texto}</Text>
    </Animated.View>
  );
}
