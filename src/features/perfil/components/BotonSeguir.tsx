import { StyleSheet } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { IconoCheck, IconoMas } from "../Perfiliconos";

/** Botón Seguir / Siguiendo del perfil público */
export function BotonSeguir({
  isFollowing,
  pending,
  isDark,
  name,
  onPress,
}: {
  isFollowing: boolean;
  pending: boolean;
  isDark: boolean;
  name: string;
  onPress: () => void;
}) {
  // Sin seguir: botón sólido. Siguiendo: botón suave.
  const fondo = isFollowing
    ? isDark
      ? "#1E293B"
      : "#E5E5EA"
    : isDark
      ? "#FFFFFF"
      : "#101010";
  const texto = isFollowing
    ? isDark
      ? "#F1F5F9"
      : "#101010"
    : isDark
      ? "#101010"
      : "#FFFFFF";

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={
        isFollowing ? `Dejar de seguir a ${name}` : `Seguir a ${name}`
      }
      accessibilityState={{ selected: isFollowing, busy: pending }}
      onPress={onPress}
      disabled={pending}
      style={[
        styles.boton,
        { backgroundColor: fondo, opacity: pending ? 0.6 : 1 },
      ]}
    >
      {isFollowing ? (
        <IconoCheck size={16} color={texto} />
      ) : (
        <IconoMas size={16} color={texto} />
      )}
      <Text style={[styles.texto, { color: texto }]}>
        {isFollowing ? "Siguiendo" : "Seguir"}
      </Text>
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  texto: { fontSize: 14, fontWeight: "600" },
});
