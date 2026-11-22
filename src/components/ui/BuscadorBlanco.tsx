import { useEffect, useRef, type ComponentRef } from "react";
import { StyleSheet, TextInput } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { TRANSICION_MODULO } from "@/constants/motion";
import {
  GROSOR_LUPA,
  PildoraCristal,
} from "@/features/busqueda/components/PildoraCristal";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/**
 * Buscador de cristal en forma de píldora (notificaciones, favoritos y chats), igual al del
 * inicio y al del módulo de búsqueda: mismo alto, lupa, letra y la X para borrar. Con
 * `personas` muestra la etiqueta "@ Personas": el texto empieza con "@" y se busca por usuario.
 */
export function BuscadorBlanco({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  personas = false,
  autoFocus = false,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  personas?: boolean;
  /**
   * Abre el teclado al montar (pantallas que solo sirven para buscar). Espera a que termine la
   * entrada del módulo: abrirlo durante la animación la hacía sentir lenta y pesada
   */
  autoFocus?: boolean;
  /** Al pulsar "Buscar" en el teclado */
  onSubmitEditing?: () => void;
}) {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";
  const entrada = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const espera = setTimeout(
      () => entrada.current?.focus(),
      TRANSICION_MODULO.entrada.duration,
    );
    return () => clearTimeout(espera);
  }, [autoFocus]);

  return (
    <PildoraCristal style={styles.buscador}>
      <IconoBusqueda
        size={22}
        color={isDark ? "#E3DEED" : "#4A4D57"}
        grosorExtra={GROSOR_LUPA}
      />
      <TextInput
        ref={entrada}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        style={[styles.entrada, { color: texto }]}
      />
      {personas ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          accessible
          accessibilityLabel="Buscando personas"
          style={styles.etiquetaPersonas}
        >
          <Text style={styles.etiquetaPersonasTexto}>@ Personas</Text>
        </Animated.View>
      ) : null}
      {value ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Borrar texto"
          hitSlop={10}
          onPress={() => onChangeText("")}
          style={[
            styles.limpiar,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.18)"
                : "rgba(0,0,0,0.12)",
            },
          ]}
        >
          <AppIcon name="close" size={11} color={texto} />
        </PressableScale>
      ) : null}
    </PildoraCristal>
  );
}

const styles = StyleSheet.create({
  buscador: { marginHorizontal: 15, marginTop: 18 },
  entrada: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  limpiar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetaPersonas: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#E8F1FF",
  },
  etiquetaPersonasTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11.5,
    color: "#1C77FF",
  },
});
