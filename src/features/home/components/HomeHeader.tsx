import { Image } from "expo-image";
import { memo } from "react";
import { View } from "react-native";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";
import { ETIQUETA_BUSQUEDA } from "@/features/busqueda/frasesBusqueda";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { IconoBusqueda } from "./IconosTarjeta";

/**
 * Cabecera del inicio: el logo y, a la derecha, la búsqueda (lleva al módulo de búsqueda) a la
 * izquierda de la campana, con los mismos botones de los demás módulos (`BotonBarra`).
 */
export const HomeHeader = memo(function HomeHeader({
  onBuscar,
}: {
  onBuscar: () => void;
}) {
  // styles solo se usa para el logo
  const { styles, isDark } = useAppTheme();

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between gap-3">
        {/* Logo — lado izquierdo */}
        <View className="flex-1 min-w-0 flex-row items-center gap-2">
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/logos-reloop/logoo.png")}
            contentFit="contain"
            style={styles.brandLogo}
          />
        </View>

        {/* Lado derecho: la búsqueda a la izquierda de la campana */}
        <View className="flex-row items-center gap-2">
          <BotonBarra etiqueta={ETIQUETA_BUSQUEDA} onPress={onBuscar}>
            <IconoBusqueda
              size={23}
              color={isDark ? "#FFFFFF" : "#23242C"}
              grosorExtra={0.5}
            />
          </BotonBarra>
          <NotificationBellButton />
        </View>
      </View>
    </View>
  );
});
