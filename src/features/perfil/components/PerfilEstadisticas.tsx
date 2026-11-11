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

interface Estadistica {
  icon: ReactNode;
  value: string;
  label: string;
}

/** Publicaciones, seguidores y reputación en una línea: [icono] número texto. */
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
  const { texto, suave } = coloresTarjeta(isDark);
  const items: Estadistica[] = [
    {
      icon: <IconoPublicaciones size={18} color={COLOR_ICONO_PUBLICACIONES} />,
      value: publicaciones,
      label: "Posts",
    },
    {
      icon: <IconoSeguidores size={18} color={COLOR_ICONO_SEGUIDORES} />,
      value: seguidores,
      label: "Seguidores",
    },
    {
      icon: <IconoReputacion size={18} color={COLOR_ICONO_REPUTACION} />,
      value: reputacion,
      label: "Reputación",
    },
  ];

  return (
    <View style={estilosPerfil.statsContainer}>
      {items.map((item) => (
        // En una línea: [icono] número en negrita y el texto en gris
        <View key={item.label} style={estilosPerfil.statItem}>
          {item.icon}
          <Text style={[estilosPerfil.statValue, { color: texto }]}>
            {item.value}
          </Text>
          <Text
            style={[estilosPerfil.statLabel, { color: suave }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
