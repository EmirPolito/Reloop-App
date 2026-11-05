import { StyleSheet, View } from "react-native";

import { Text } from "@/features/shared/Text";
import {
  coloresTarjeta,
  estilosPerfil,
  MARGEN_STATS,
} from "../perfilEstilos";
import { DESCRIPCION_POR_DEFECTO, type DatosPerfil } from "../Perfiltemas";
import { PildoraPerfil } from "../Pildoraperfil";
import { PerfilEstadisticas } from "./PerfilEstadisticas";

/** Margen de las estadísticas cuando NO hay etiquetas (las tarjetas suben un poco). */
const MARGEN_STATS_SIN_ETIQUETAS = 14;

/** Nombre, descripción, etiquetas y estadísticas: la parte de texto de un perfil, propio o ajeno. */
export function PerfilInformacion({
  profile,
  stats,
  isDark,
}: {
  profile: DatosPerfil;
  stats: { publicaciones: string; seguidores: string; reputacion: string };
  isDark: boolean;
}) {
  const { texto } = coloresTarjeta(isDark);
  const hayEtiquetas = profile.pills.length > 0;

  return (
    <View style={estilosPerfil.profileInfoSection}>
      <Text style={[estilosPerfil.profileName, { color: texto }]}>
        {profile.name}
      </Text>
      <Text style={estilosPerfil.profileSubtitle}>
        {profile.description.trim() || DESCRIPCION_POR_DEFECTO}
      </Text>

      {hayEtiquetas ? (
        <View style={styles.tagsRow}>
          {profile.pills.map((pill) => (
            <PildoraPerfil
              key={pill.id}
              text={pill.text}
              color={pill.color}
              icon={pill.icon}
              isDark={isDark}
            />
          ))}
        </View>
      ) : null}

      <PerfilEstadisticas
        publicaciones={stats.publicaciones}
        seguidores={stats.seguidores}
        reputacion={stats.reputacion}
        marginTop={hayEtiquetas ? MARGEN_STATS : MARGEN_STATS_SIN_ETIQUETAS}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tagsRow: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 7.5,
  },
});
