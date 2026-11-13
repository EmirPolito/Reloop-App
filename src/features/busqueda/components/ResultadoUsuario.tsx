import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { conArroba } from "@/features/perfil/username";
import { Text } from "@/features/shared/Text";
import type { UsuarioEncontrado } from "../userSearchRepository";

const LADO_AVATAR = 46;

/** Fila de una persona en la búsqueda con "@": avatar, nombre y @username */
export const ResultadoUsuario = memo(function ResultadoUsuario({
  usuario,
  isDark,
  onOpen,
}: {
  usuario: UsuarioEncontrado;
  isDark: boolean;
  onOpen: (uid: string) => void;
}) {
  const arroba = usuario.username ? conArroba(usuario.username) : null;
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={
        arroba ? `${usuario.name}, ${arroba}. Ver perfil` : `${usuario.name}. Ver perfil`
      }
      onPress={() => onOpen(usuario.uid)}
      style={[styles.fila, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
    >
      <UserAvatar
        photo={usuario.photo}
        orb={usuario.orb}
        name={usuario.name}
        size={LADO_AVATAR}
      />
      <View style={styles.textos}>
        <Text
          numberOfLines={1}
          style={[styles.nombre, { color: isDark ? "#F1F5F9" : "#101010" }]}
        >
          {usuario.name}
        </Text>
        {arroba ? (
          <Text
            numberOfLines={1}
            style={[styles.usuario, { color: isDark ? "#94A3B8" : "#8a8a8a" }]}
          >
            {arroba}
          </Text>
        ) : null}
      </View>
    </PressableSuave>
  );
});

/** Fila gris mientras cargan los resultados (mismo alto que una real) */
export function ResultadoUsuarioEsqueleto({ isDark }: { isDark: boolean }) {
  const gris = isDark ? "#273449" : "#ECECEE";
  return (
    <View
      style={[styles.fila, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
    >
      <View
        style={{
          width: LADO_AVATAR,
          height: LADO_AVATAR,
          borderRadius: LADO_AVATAR / 2,
          backgroundColor: gris,
        }}
      />
      <View style={[styles.textos, { gap: 8 }]}>
        <View style={[styles.barra, { width: "55%", backgroundColor: gris }]} />
        <View style={[styles.barra, { width: "35%", backgroundColor: gris }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  textos: { flex: 1, minWidth: 0, gap: 2 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 13.5 },
  barra: { height: 11, borderRadius: 6 },
});
