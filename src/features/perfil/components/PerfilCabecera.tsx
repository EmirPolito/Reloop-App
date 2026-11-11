import type { ReactNode } from "react";
import { View } from "react-native";

import { estilosPerfil, fondoPerfil } from "../perfilEstilos";

/** Fila bajo la portada: avatar a la izquierda y, opcionalmente, una acción a la derecha. */
export function PerfilCabecera({
  isDark,
  avatar,
  accion,
}: {
  isDark: boolean;
  avatar: ReactNode;
  accion?: ReactNode;
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
      {accion ? <View style={{ marginBottom: 8 }}>{accion}</View> : null}
    </View>
  );
}
