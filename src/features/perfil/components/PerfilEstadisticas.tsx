import { Fragment, type ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/features/shared/Text";
// Iconos de Publicaciones y Seguidores: guardados para usarlos más adelante.
// import { IconoPublicaciones, IconoSeguidores } from "../Perfiliconos";
// import { COLOR_ICONO_PUBLICACIONES, COLOR_ICONO_SEGUIDORES } from "../perfilEstilos";
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
  icon?: ReactNode;
  value: string;
  label: string;
}

/** Tarjeta con 3 columnas separadas por divisores: texto arriba, número abajo. Valoración va en medio. */
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
      icon: <IconoPublicaciones size={18} color={COLOR_ICONO_PUBLICACIONES} />,
      value: publicaciones,
      label: "Publicaciones",
    },
    {
      icon: <IconoReputacion size={18} color={COLOR_ICONO_REPUTACION} />,
      value: reputacion,
      label: "Valoración",
    },
    {
      icon: <IconoSeguidores size={18} color={COLOR_ICONO_SEGUIDORES} />,
      value: seguidores,
      label: "Seguidores",
    },
  ];

  return (
    <View style={estilosPerfil.statsContainer}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? (
            <View
              style={[estilosPerfil.statDivider, { backgroundColor: divisor }]}
            />
          ) : null}

          <View style={estilosPerfil.statItem}>
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
