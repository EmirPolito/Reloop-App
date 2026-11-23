import { Skeleton } from "heroui-native";
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
import { conArroba } from "../nombreUsuario";

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

  // Mientras llega su perfil, el esqueleto de la fila (no una fila vacía)
  if (perfil === undefined) return <FilaSeguidorEsqueleto />;

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

/** Fila de carga (el `Skeleton` de HeroUI): avatar, nombre, @usuario y el botón */
export function FilaSeguidorEsqueleto() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fila}
    >
      <Skeleton
        className="rounded-full"
        style={{ width: LADO_AVATAR, height: LADO_AVATAR }}
      />
      <View style={[styles.textos, { gap: 8 }]}>
        <Skeleton className="h-2.5 w-1/2 rounded-md" />
        <Skeleton className="h-2.5 w-1/3 rounded-md" />
      </View>
      <Skeleton className="rounded-full" style={styles.botonEsqueleto} />
    </View>
  );
}

const styles = StyleSheet.create({
  botonEsqueleto: { width: 104, height: 40 },
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
