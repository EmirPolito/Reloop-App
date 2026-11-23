import { Skeleton } from "heroui-native";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { conArroba } from "@/features/perfil/nombreUsuario";
import { Text } from "@/features/shared/Text";
import type { UsuarioEncontrado } from "../repositorioPersonas";

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
        arroba
          ? `${usuario.name}, ${arroba}. Ver perfil`
          : `${usuario.name}. Ver perfil`
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

/** Fila de carga (el `Skeleton` de HeroUI, con su brillo): mismo alto que una real */
export function ResultadoUsuarioEsqueleto({ isDark }: { isDark: boolean }) {
  return (
    <View
      style={[styles.fila, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}
    >
      <Skeleton
        className="rounded-full"
        style={{ width: LADO_AVATAR, height: LADO_AVATAR }}
      />
      <View style={[styles.textos, { gap: 8 }]}>
        <Skeleton className="h-2.5 w-1/2 rounded-md" />
        <Skeleton className="h-2.5 w-1/3 rounded-md" />
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
});
