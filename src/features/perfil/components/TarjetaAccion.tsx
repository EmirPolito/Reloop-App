import type { ReactNode } from "react";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { IconoFlecha } from "../Perfiliconos";
import { estilosPerfil } from "../perfilEstilos";

/** Tarjeta de una sola acción: icono, texto y flecha (cerrar sesión, enviar mensaje). */
export function TarjetaAccion({
  icon,
  label,
  labelColor,
  backgroundColor,
  arrowColor,
  onPress,
  accessibilityLabel,
}: {
  icon: ReactNode;
  label: string;
  labelColor: string;
  backgroundColor: string;
  arrowColor: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[estilosPerfil.tarjetaAccion, { backgroundColor }]}
    >
      {icon}
      <Text style={[estilosPerfil.tarjetaAccionTexto, { color: labelColor }]}>
        {label}
      </Text>
      <IconoFlecha size={22} color={arrowColor} />
    </PressableSuave>
  );
}
