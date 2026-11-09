import { LinearGradient } from "expo-linear-gradient";
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
  const gradienteBlanco = isDark
    ? (["rgba(15, 23, 42, 0)", "#0F172A"] as const)
    : (["rgba(248, 248, 248, 0)", "#f8f8f8"] as const);

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

      {/* Degradado blanco debajo de la mitad del avatar para abajo */}
      <LinearGradient
        colors={gradienteBlanco}
        style={estilosPerfil.degradadoAvatar}
        pointerEvents="none"
      />

      {children}
    </View>
  );
}
