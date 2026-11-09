import type { ReactNode } from "react";
import { View } from "react-native";

import type { ColorPerfil } from "../Perfiltemas";
import { estilosPerfil } from "../perfilEstilos";

/**
 * Cabecera del perfil: se integra directamente sobre el fondo degradado de la pantalla
 * sin generar capas duplicadas ni sombras de tarjeta.
 */
export function PerfilCabecera({
  isDark,
  nav,
  avatar,
  children,
}: {
  color?: ColorPerfil;
  isDark: boolean;
  nav: ReactNode;
  avatar: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View style={estilosPerfil.headerContainer}>
      <View style={estilosPerfil.skyBackground}>
        <View style={estilosPerfil.topNav}>{nav}</View>

        <View style={estilosPerfil.avatarContainer}>
          <View
            style={[
              estilosPerfil.avatarRing,
              { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" },
            ]}
          >
            {avatar}
          </View>
        </View>
      </View>

      {children}
    </View>
  );
}
