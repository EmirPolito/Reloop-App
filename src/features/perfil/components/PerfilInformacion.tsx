import { View } from "react-native";

import { Text } from "@/features/shared/Text";
import { coloresTarjeta, estilosPerfil } from "../perfilEstilos";
import { DESCRIPCION_POR_DEFECTO, type DatosPerfil } from "../Perfiltemas";
import { PildoraPerfil } from "../Pildoraperfil";
import { PerfilEstadisticas } from "./PerfilEstadisticas";

/** Nombre, etiquetas, descripción y estadísticas: la parte de texto de un perfil, propio o ajeno. */
export function PerfilInformacion({
  profile,
  stats,
  isDark,
}: {
  profile: DatosPerfil;
  stats: { publicaciones: string; seguidores: string; reputacion: string };
  isDark: boolean;
}) {
  const { texto, suave } = coloresTarjeta(isDark);

  return (
    <View style={estilosPerfil.profileInfoSection}>
      <Text style={[estilosPerfil.profileName, { color: texto }]}>
        {profile.name}
      </Text>

      <Text style={[estilosPerfil.profileSubtitle, { color: suave }]}>
        {profile.description.trim() || DESCRIPCION_POR_DEFECTO}
      </Text>

      {profile.pills.length > 0 ? (
        <View style={estilosPerfil.tagsRow}>
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
        isDark={isDark}
      />
    </View>
  );
}
