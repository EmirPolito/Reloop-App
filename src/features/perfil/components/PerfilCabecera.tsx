import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { View } from "react-native";

import { type ColorPerfil, gradienteHeader } from "../Perfiltemas";
import { estilosPerfil } from "../perfilEstilos";

/**
 * Cabecera del perfil: degradado de color que se funde con el fondo de la app y avatar centrado.
 * `nav` ocupa la barra superior, `avatar` va dentro del aro y `children` flota sobre
 * la cabecera (stickers).
 */
export function PerfilCabecera({
  color,
  isDark,
  nav,
  avatar,
  children,
}: {
  color: ColorPerfil;
  isDark: boolean;
  nav: ReactNode;
  avatar: ReactNode;
  children?: ReactNode;
}) {
  return (
    <View style={estilosPerfil.headerContainer}>
      <LinearGradient
        colors={gradienteHeader(color, isDark)}
        locations={[0, 0.4, 0.72, 1]}
        style={estilosPerfil.skyBackground}
      >
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
      </LinearGradient>

      {children}
    </View>
  );
}
