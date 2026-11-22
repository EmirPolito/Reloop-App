import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { BulkSearchIcon } from "@/features/chats/components/ChatIcons";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { getFollowers, getFollowing } from "../followRepository";
import { usePerfilDe } from "../hooks/usePerfilDe";
import { normalizarNombre } from "../username";
import { FilaSeguidor } from "./FilaSeguidor";

/**
 * Seguidores y seguidos de una persona en una sola lista (sin repetir a quien está en las
 * dos): avatar, nombre, @usuario y el botón Seguir. Lo de arriba (volver, título y buscador)
 * no se mueve, como en el buscador de chats: solo se desplaza la lista. Se lee al entrar y al
 * jalar para refrescar, no en vivo: si dejas de seguir a alguien por error, sigue en la lista
 * para volver a seguirlo.
 */
export function PantallaSeguidores({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back, openUserProfile } = useAppNavigation();
  const [busqueda, setBusqueda] = useState("");
  const [ids, setIds] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(
    () =>
      Promise.all([getFollowers(userId), getFollowing(userId)]).then(
        ([seguidores, seguidos]) => {
          // Primero sus seguidores y luego a quienes sigue (el más reciente primero) que no lo siguen
          setIds([...new Set([...seguidores, ...seguidos])]);
          setError(false);
        },
        (e) => {
          console.warn(
            "No se pudieron leer los seguidores.",
            describeFirestoreError(e),
          );
          setError(true);
        },
      ),
    [userId],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = () => {
    setRefrescando(true);
    void cargar().finally(() => setRefrescando(false));
  };

  const perfiles = usePerfilDe.varias(ids ?? []);
  const termino = normalizarNombre(busqueda.trim().replace(/^@/, ""));
  const visibles = useMemo(
    () =>
      termino
        ? (ids ?? []).filter((id) => {
            const p = perfiles.get(id);
            return (
              normalizarNombre(p?.name ?? "").includes(termino) ||
              (p?.username ?? "").includes(termino)
            );
          })
        : (ids ?? []),
    [ids, perfiles, termino],
  );

  const texto = isDark ? "#F1F5F9" : "#101010";

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={styles.barra}>
        <BotonBarra etiqueta="Volver" onPress={() => conSalida(back)}>
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={texto} />
          </View>
        </BotonBarra>
        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          Seguidores y seguidos
        </Text>
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar por nombre o @usuario"
        accessibilityLabel="Buscar personas en la lista"
      />

      {ids === null && !error ? (
        <LoadingState />
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(id) => id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: insets.bottom + 40,
          }}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={refrescar} />
          }
          renderItem={({ item }) => (
            <FilaSeguidor uid={item} onAbrir={openUserProfile} />
          )}
          ListEmptyComponent={
            <IllustratedEmptyState
              icon={<BulkSearchIcon size={80} />}
              title={
                error
                  ? "No pudimos cargar la lista"
                  : termino
                    ? "Sin resultados"
                    : "Aún no hay nadie aquí"
              }
              message={
                error
                  ? "Desliza hacia abajo para intentarlo de nuevo."
                  : termino
                    ? "Prueba con otro nombre o @usuario."
                    : "Cuando siga o lo sigan, aparecerán aquí."
              }
              style={styles.vacio}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
  vacio: { paddingTop: 60 },
});
