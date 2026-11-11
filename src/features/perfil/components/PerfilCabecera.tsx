import type { ReactNode } from "react";
import { View } from "react-native";

import { estilosPerfil, fondoPerfil } from "../perfilEstilos";

/** Fila del avatar, arriba del nombre, alineado a la izquierda. */
export function PerfilCabecera({
  isDark,
  avatar,
}: {
  isDark: boolean;
  avatar: ReactNode;
}) {
  return (
    <View style={estilosPerfil.filaAvatar}>
      <View
        style={[
          estilosPerfil.avatarMarco,
          { backgroundColor: fondoPerfil(isDark) },
        ]}
      >
        {avatar}
      </View>
    </View>
  );
}
