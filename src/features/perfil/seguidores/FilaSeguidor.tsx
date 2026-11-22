import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { usePerfilDe } from "../hooks/usePerfilDe";
import { useSigoA } from "../hooks/useSigoA";
import { conArroba } from "../username";

const LADO_AVATAR = 50;

/**
 * Una persona en la lista de seguidores y seguidos: avatar (con insignia si tiene Premium),
 * nombre y @usuario; a la derecha, el botón "Seguir" (oscuro) o "Siguiendo" (suave). Tocar la
 * fila abre su perfil. En tu propia fila no hay botón.
 */
export const FilaSeguidor = memo(function FilaSeguidor({
  uid,
  onAbrir,
}: {
  uid: string;
  onAbrir: (uid: string) => void;
}) {
  const { isDark } = useAppTheme();
  const { uid: yo } = useSessionUser();
  const perfil = usePerfilDe(uid);
  const { sigo, pendiente, alternar } = useSigoA(uid);
  const nombre = perfil?.name ?? "";
  const arroba = perfil?.username ? conArroba(perfil.username) : null;

  const fondoBoton = sigo
    ? isDark
      ? "rgba(255,255,255,0.12)"
      : "#EFEFF2"
    : isDark
      ? "#F1F5F9"
      : "#2B2B2B";
  const textoBoton = sigo
    ? isDark
      ? "#F1F5F9"
      : "#101010"
    : isDark
      ? "#101010"
      : "#FFFFFF";

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${nombre}`}
      onPress={() => onAbrir(uid)}
      style={styles.fila}
    >
      <AvatarVendedor
        ownerId={uid}
        fallbackName={nombre}
        size={LADO_AVATAR}
        ajusteInsignia={{ escala: 0.42, right: -2, bottom: -4 }}
      />
      <View style={styles.textos}>
        <Text
          numberOfLines={1}
          style={[styles.nombre, { color: isDark ? "#F1F5F9" : "#101010" }]}
        >
          {nombre}
        </Text>
        {arroba ? (
          <Text
            numberOfLines={1}
            style={[styles.usuario, { color: isDark ? "#94A3B8" : "#8A8A8F" }]}
          >
            {arroba}
          </Text>
        ) : null}
      </View>
      {uid !== yo && sigo !== null ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={
            sigo ? `Dejar de seguir a ${nombre}` : `Seguir a ${nombre}`
          }
          accessibilityState={{ selected: sigo, busy: pendiente }}
          hitSlop={6}
          onPress={() => void alternar()}
          scaleTo={0.94}
          style={[styles.boton, { backgroundColor: fondoBoton }]}
        >
          <Text style={[styles.botonTexto, { color: textoBoton }]}>
            {sigo ? "Siguiendo" : "Seguir"}
          </Text>
        </PressableScale>
      ) : null}
    </PressableSuave>
  );
});

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 9,
  },
  textos: { flex: 1, minWidth: 0, gap: 3 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 15.5 },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 13.5 },
  // Píldora del mismo ancho con "Seguir" o "Siguiendo", para que no brinque al cambiar
  boton: {
    minWidth: 104,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
