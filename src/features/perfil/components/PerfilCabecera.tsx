import type { ReactNode } from "react";
import { View } from "react-native";

import { SOLAPE_PORTADA, estilosPerfil, fondoPerfil } from "../perfilEstilos";

/**
 * Fila del avatar, arriba del nombre, alineado a la izquierda. Con `solapar`, sube sobre la
 * parte inferior de la portada, donde la imagen ya se disuelve en el fondo.
 */
export function PerfilCabecera({
  isDark,
  avatar,
  solapar = false,
}: {
  isDark: boolean;
  avatar: ReactNode;
  solapar?: boolean;
}) {
  return (
    <View
      style={[
        estilosPerfil.filaAvatar,
        solapar && { marginTop: -SOLAPE_PORTADA },
      ]}
    >
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
