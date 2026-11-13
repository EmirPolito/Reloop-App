import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PrimaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { Text } from "@/features/shared/Text";
import { useUserSearch } from "../hooks/useUserSearch";
import { ResultadoUsuario, ResultadoUsuarioEsqueleto } from "./ResultadoUsuario";

const FILAS_ESQUELETO = 4;

/**
 * Resultados del modo "@" del buscador del inicio: personas que coinciden o, con solo "@",
 * las cuentas más recientes como sugerencia. Incluye carga, vacío y error con reintento.
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
  const busqueda = useUserSearch(termino);
  const suave = isDark ? "#94A3B8" : "#8a8a8a";

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, { color: suave }]}>
        {termino ? "Personas" : "Personas sugeridas"}
      </Text>

      {busqueda.estado === "cargando" ? (
        <View style={styles.lista} accessibilityLabel="Buscando personas">
          {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
            <ResultadoUsuarioEsqueleto key={i} isDark={isDark} />
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
        <EmptyState
          title={termino ? `Sin resultados para "@${termino}"` : "Aún no hay personas"}
          message="Prueba con otro usuario o con su nombre."
          icon="search"
        />
      ) : null}

      {busqueda.estado === "listo" && busqueda.usuarios.length > 0 ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.lista}>
          {busqueda.usuarios.map((usuario) => (
            <ResultadoUsuario
              key={usuario.uid}
              usuario={usuario}
              isDark={isDark}
              onOpen={onOpenUser}
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
  lista: { gap: 8 },
});
