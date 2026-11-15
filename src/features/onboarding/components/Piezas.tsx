import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";

import { renderPerfilIcon } from "@/features/perfil/Perfiliconos";
import { TEMAS, type PildoraPerfilData } from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import { LETRA, coloresOnboarding } from "../temaOnboarding";

/** Botón redondo con la palomita, dentro de un campo: aparece al escribir */
export function BotonPalomita({
  isDark,
  onPress,
  cargando = false,
  deshabilitado = false,
  etiqueta = "Listo",
}: {
  isDark: boolean;
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  etiqueta?: string;
}) {
  const c = coloresOnboarding(isDark);
  return (
    <Animated.View
      entering={ZoomIn.duration(160)}
      exiting={ZoomOut.duration(120)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityState={{
          disabled: deshabilitado || cargando,
          busy: cargando,
        }}
        disabled={deshabilitado || cargando}
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => [
          styles.palomita,
          { backgroundColor: c.palomitaFondo },
          (pressed || deshabilitado) && { opacity: 0.55 },
        ]}
      >
        {cargando ? (
          <ActivityIndicator size="small" color={c.palomitaIcono} />
        ) : (
          <Ionicons name="checkmark" size={19} color={c.palomitaIcono} />
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Etiqueta con su icono (si tiene) y la palabra.
 * - `perfil`: mismo tamaño y aspecto que en el perfil (píldora chica con el color del tema).
 * - `editable`: un poco más grande para tocarla, con una × para quitarla.
 */
export function ChipEtiqueta({
  etiqueta,
  isDark,
  tamano = "perfil",
  onQuitar,
}: {
  etiqueta: PildoraPerfilData;
  isDark: boolean;
  tamano?: "perfil" | "editable";
  onQuitar?: () => void;
}) {
  const c = coloresOnboarding(isDark);
  const tema = TEMAS[etiqueta.color] ?? TEMAS.azul;

  if (tamano === "perfil") {
    return (
      <View
        style={[
          styles.chipPerfil,
          { backgroundColor: tema.pillBg, borderColor: tema.pillBorder },
        ]}
      >
        {etiqueta.icon
          ? renderPerfilIcon(etiqueta.icon, 13.5, tema.accent)
          : null}
        <Text
          style={[
            LETRA.medium,
            styles.textoPerfil,
            { color: isDark ? "#E5E7EB" : "#757575" },
          ]}
        >
          {etiqueta.text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.chipEditable,
        { backgroundColor: tema.pillBg, borderColor: tema.pillBorder },
      ]}
    >
      {etiqueta.icon ? renderPerfilIcon(etiqueta.icon, 15, tema.accent) : null}
      <Text style={[LETRA.medium, { fontSize: 13, color: c.texto }]}>
        {etiqueta.text}
      </Text>
      {onQuitar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${etiqueta.text}`}
          hitSlop={8}
          onPress={onQuitar}
        >
          <Ionicons name="close" size={14} color={c.suave} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  palomita: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Igual que la píldora del perfil
  chipPerfil: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3.5,
    height: 21,
    paddingHorizontal: 5.5,
    borderRadius: 17,
    borderWidth: 1,
  },
  textoPerfil: { fontSize: 10.5 },
  chipEditable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
});
