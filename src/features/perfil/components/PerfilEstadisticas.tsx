import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/features/shared/Text";
import {
  IconoPublicaciones,
  IconoReputacion,
  IconoSeguidores,
} from "../Perfiliconos";
import {
  COLOR_ICONO_PUBLICACIONES,
  COLOR_ICONO_REPUTACION,
  COLOR_ICONO_SEGUIDORES,
  coloresTarjeta,
  estilosPerfil,
} from "../perfilEstilos";

/** Tarjeta de estadística: [icono] número, y debajo la etiqueta */
function TarjetaEstadistica({
  icon,
  value,
  label,
  bg,
  textColor,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  bg: string;
  textColor: string;
}) {
  return (
    <View style={[estilosPerfil.statCard, { backgroundColor: bg }]}>
      <View style={estilosPerfil.statValueRow}>
        {icon}
        <Text style={[estilosPerfil.statValue, { color: textColor }]}>
          {value}
        </Text>
      </View>
      <Text style={estilosPerfil.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Fila con las tres tarjetas: publicaciones, seguidores y reputación. */
export function PerfilEstadisticas({
  publicaciones,
  seguidores,
  reputacion,
  marginTop,
  isDark,
}: {
  publicaciones: string;
  seguidores: string;
  reputacion: string;
  marginTop: number;
  isDark: boolean;
}) {
  const { fondoTarjeta, texto } = coloresTarjeta(isDark);
  return (
    <View style={[estilosPerfil.statsContainer, { marginTop }]}>
      <TarjetaEstadistica
        icon={<IconoPublicaciones size={22} color={COLOR_ICONO_PUBLICACIONES} />}
        value={publicaciones}
        label="Publicaciones"
        bg={fondoTarjeta}
        textColor={texto}
      />
      <TarjetaEstadistica
        icon={<IconoSeguidores size={22} color={COLOR_ICONO_SEGUIDORES} />}
        value={seguidores}
        label="Seguidores"
        bg={fondoTarjeta}
        textColor={texto}
      />
      <TarjetaEstadistica
        icon={<IconoReputacion size={22} color={COLOR_ICONO_REPUTACION} />}
        value={reputacion}
        label="Reputación"
        bg={fondoTarjeta}
        textColor={texto}
      />
    </View>
  );
}
