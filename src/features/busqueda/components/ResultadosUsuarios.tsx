import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { BulkSearchIcon } from "@/features/chats/components/IconosChats";
import {
  FilaSeguidor,
  FilaSeguidorEsqueleto,
} from "@/features/perfil/seguidores/FilaSeguidor";
import { Text } from "@/features/shared/Text";
import { useBuscarPersonas } from "../hooks/useBuscarPersonas";

const FILAS_ESQUELETO = 4;

/**
 * Resultados del modo "@" del buscador del inicio: personas que coinciden o, con solo "@",
 * las cuentas más recientes como sugerencia. Incluye carga, vacío y error con reintento. Cada
 * persona sale sin tarjeta, igual que en seguidores y seguidos (con su botón de seguir).
 */
export function ResultadosUsuarios({
  termino,
  isDark,
  onOpenUser,
}: {
  /** Ya normalizado, sin "@" */
  termino: string;
  isDark: boolean;
  onOpenUser: (uid: string) => void;
}) {
  const busqueda = useBuscarPersonas(termino);
  const suave = isDark ? "#94A3B8" : "#8a8a8a";

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, { color: suave }]}>
        {termino ? "Personas" : "Personas sugeridas"}
      </Text>

      {busqueda.estado === "cargando" ? (
        <View style={styles.lista} accessibilityLabel="Buscando personas">
          {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
            <FilaSeguidorEsqueleto key={i} />
          ))}
        </View>
      ) : null}

      {busqueda.estado === "error" ? (
        <View>
          <EmptyState
            title="No pudimos buscar personas"
            message="Revisa tu conexión e inténtalo de nuevo."
            icon="search"
          />
          <PrimaryButton label="Reintentar" onPress={busqueda.reintentar} />
        </View>
      ) : null}

      {busqueda.estado === "listo" && busqueda.usuarios.length === 0 ? (
        // Sin tarjeta, como cuando la búsqueda de publicaciones no encuentra nada
        <IllustratedEmptyState
          icon={<BulkSearchIcon size={80} />}
          title={
            termino
              ? `Sin resultados para "@${termino}"`
              : "Aún no hay personas"
          }
          message="Prueba con otro usuario o con su nombre."
          conInter
          style={styles.vacio}
        />
      ) : null}

      {busqueda.estado === "listo" && busqueda.usuarios.length > 0 ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.lista}>
          {busqueda.usuarios.map((usuario) => (
            <FilaSeguidor
              key={usuario.uid}
              uid={usuario.uid}
              onAbrir={onOpenUser}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingTop: 14, gap: 10 },
  titulo: { fontFamily: "Inter_500Medium", fontSize: 13, paddingHorizontal: 4 },
  // Sin espacio extra: cada fila trae el suyo, como en seguidores
  lista: { paddingHorizontal: 4 },
  vacio: { paddingTop: 56, paddingBottom: 140 },
});
