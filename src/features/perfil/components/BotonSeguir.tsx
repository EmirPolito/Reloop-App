import { StyleSheet } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { IconoCheck, IconoMas } from "../iconosPerfil";

/**
 * Botón Seguir / Siguiendo del perfil público. Ocupa todo su espacio (junto a Mensaje), así
 * no cambia de tamaño al pasar de "Seguir" a "Siguiendo"; y no se atenúa mientras se guarda
 * (solo deja de responder), para que el cambio de color se vea limpio.
 */
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
      style={[styles.boton, { backgroundColor: fondo }]}
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 21,
  },
  texto: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
