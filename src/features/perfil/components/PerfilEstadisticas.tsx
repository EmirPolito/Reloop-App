import { Fragment, type ReactNode } from "react";
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

interface Estadistica {
  icon: ReactNode;
  value: string;
  label: string;
}

/** Tarjeta con publicaciones, seguidores y reputación: [icono] número, y debajo el texto. */
export function PerfilEstadisticas({
  publicaciones,
  seguidores,
  reputacion,
  isDark,
}: {
  publicaciones: string;
  seguidores: string;
  reputacion: string;
  isDark: boolean;
}) {
  const { texto, suave, divisor } = coloresTarjeta(isDark);
  const items: Estadistica[] = [
    {
      icon: <IconoPublicaciones size={19} color={COLOR_ICONO_PUBLICACIONES} />,
      value: publicaciones,
      label: "Publicaciones",
    },
    {
      icon: <IconoSeguidores size={19} color={COLOR_ICONO_SEGUIDORES} />,
      value: seguidores,
      label: "Seguidores",
    },
    {
      icon: <IconoReputacion size={19} color={COLOR_ICONO_REPUTACION} />,
      value: reputacion,
      label: "Reputación",
    },
  ];

  return (
    <View style={estilosPerfil.statsContainer}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <View
              style={[estilosPerfil.statDivisor, { backgroundColor: divisor }]}
            />
          ) : null}
          <View style={estilosPerfil.statColumna}>
            <View style={estilosPerfil.statValueRow}>
              {item.icon}
              <Text style={[estilosPerfil.statValue, { color: texto }]}>
                {item.value}
              </Text>
            </View>
            <Text
              style={[estilosPerfil.statLabel, { color: suave }]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}
