import { ActivityIndicator, StyleSheet } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { INTER, coloresEditar } from "@/features/perfil/editar/editarTema";
import { Text } from "@/features/shared/Text";

/** Botón principal de un paso (Continuar, Finalizar): el mismo de "Usar este avatar" */
export function BotonPaso({
  texto,
  isDark,
  cargando = false,
  deshabilitado = false,
  onPress,
}: {
  texto: string;
  isDark: boolean;
  cargando?: boolean;
  deshabilitado?: boolean;
  onPress: () => void;
}) {
  const c = coloresEditar(isDark);
  const inactivo = cargando || deshabilitado;
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={[
        styles.boton,
        { backgroundColor: c.texto },
        inactivo && { opacity: 0.55 },
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={isDark ? "#101010" : "#FFFFFF"} />
      ) : (
        <Text
          style={[
            INTER.medium,
            { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" },
          ]}
        >
          {texto}
        </Text>
      )}
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
