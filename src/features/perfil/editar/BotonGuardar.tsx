import {
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { coloresEditar, INTER } from "./editarTema";

/**
 * El botón principal de los drawers de Editar perfil (Guardar, Usar este fondo...): ancho,
 * del color del texto y con el texto invertido. Mientras guarda muestra una ruedita y no se
 * puede volver a tocar.
 */
export function BotonGuardar({
  texto,
  etiqueta = texto,
  isDark,
  guardando,
  disabled = guardando,
  atenuarAlGuardar = false,
  onPress,
  style,
}: {
  texto: string;
  /** Para lectores de pantalla, si debe decir más que el texto */
  etiqueta?: string;
  isDark: boolean;
  guardando: boolean;
  /** De serie, solo mientras guarda */
  disabled?: boolean;
  /** Se ve más claro mientras guarda */
  atenuarAlGuardar?: boolean;
  onPress: () => void;
  /** Márgenes según el drawer */
  style?: StyleProp<ViewStyle>;
}) {
  const colorTexto = isDark ? "#101010" : "#FFFFFF";
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled, busy: guardando }}
      disabled={disabled}
      onPress={onPress}
      style={[
        estilos.boton,
        { backgroundColor: coloresEditar(isDark).texto },
        atenuarAlGuardar && guardando && estilos.atenuado,
        style,
      ]}
    >
      {guardando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Text style={[INTER.medium, estilos.texto, { color: colorTexto }]}>
          {texto}
        </Text>
      )}
    </PressableSuave>
  );
}

const estilos = StyleSheet.create({
  boton: {
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  atenuado: { opacity: 0.6 },
  texto: { fontSize: 14.5 },
});
