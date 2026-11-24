import { Skeleton } from "heroui-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ALTO_PORTADA } from "../1-portada";
import { BORDE_AVATAR, SOLAPE_AVATAR } from "../3-informacion";
import { EsqueletoPublicaciones } from "../4-publicaciones";
import { LADO_AVATAR, fondoPerfil } from "../estilos";

/**
 * El perfil de otra persona mientras se lee: la misma forma que el perfil de verdad (portada
 * a lo ancho, el avatar que sobresale con las píldoras a su derecha, nombre, @usuario,
 * descripción, las tres estadísticas y las publicaciones de dos en dos), así al llegar los
 * datos nada cambia de lugar. Antes solo había una ruedita sobre la pantalla vacía.
 */
export function EsqueletoPerfil({ isDark }: { isDark: boolean }) {
  const insets = useSafeAreaInsets();
  const ladoMarco = LADO_AVATAR + BORDE_AVATAR * 2;
  const fondo = fondoPerfil(isDark);

  return (
    <View
      accessibilityLabel="Cargando perfil"
      accessibilityRole="progressbar"
      style={[styles.pantalla, { backgroundColor: fondo }]}
    >
      <Skeleton
        className="w-full rounded-none"
        style={{ height: insets.top + ALTO_PORTADA }}
      />

      <View
        style={[
          styles.filaAvatar,
          { marginTop: -SOLAPE_AVATAR - BORDE_AVATAR },
        ]}
      >
        <View
          style={{
            width: ladoMarco,
            height: ladoMarco,
            borderRadius: ladoMarco / 2,
            padding: BORDE_AVATAR,
            backgroundColor: fondo,
          }}
        >
          <Skeleton className="size-full rounded-full" />
        </View>
        <View style={styles.pildoras}>
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </View>
      </View>

      <View style={styles.info}>
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <Skeleton className="h-3.5 w-1/4 rounded-md" />
        <View style={styles.descripcion}>
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
        </View>
        <View style={styles.stats}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.estadistica}>
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.publicaciones}>
        <EsqueletoPublicaciones />
      </View>
    </View>
  );
}

// Las mismas medidas que `3-informacion.tsx` y `VistaPerfil.tsx`
const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  pildoras: { flexDirection: "row", gap: 9, paddingBottom: 14 },
  info: { paddingHorizontal: 16, paddingTop: 6, gap: 8 },
  descripcion: { marginTop: 6, gap: 6 },
  stats: { flexDirection: "row", marginTop: 26 },
  estadistica: { flex: 1, alignItems: "center", gap: 6 },
  publicaciones: { marginTop: 40, paddingHorizontal: 15 },
});
