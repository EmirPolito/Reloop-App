import { Image } from "expo-image";
import { memo, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { ALTO_PILDORA } from "@/features/busqueda/components/PildoraCristal";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { SelectorUniversidad } from "./SelectorUniversidad";

/**
 * Cabecera del inicio: logo, comunidad y el buscador (`buscador`), que se mueve con la lista
 * hasta quedar fijo arriba. Su posición se informa con `onLayoutBuscador`.
 */
export const HomeHeader = memo(function HomeHeader({
  buscador,
  onLayoutBuscador,
}: {
  /** El buscador, que va en la cabecera y se mueve con la lista */
  buscador: ReactNode;
  onLayoutBuscador: (event: LayoutChangeEvent) => void;
}) {
  // styles solo se usa para el logo
  const { styles } = useAppTheme();

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between gap-3 pt-[5px]">
        {/* Logo — lado izquierdo */}
        <View className="flex-1 min-w-0 flex-row items-center gap-2">
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/logos-reloop/logoo.png")}
            contentFit="contain"
            style={styles.brandLogo}
          />
        </View>

        {/* Lado derecho: el círculo de la universidad (abre su menú) a la izquierda de la campana */}
        <View className="flex-row items-center gap-2">
          <SelectorUniversidad />
          <NotificationBellButton />
        </View>
      </View>

      {/* El buscador: mismo alto y márgenes que tenía la píldora */}
      <View
        className="mt-5 mb-1"
        style={{ height: ALTO_PILDORA }}
        onLayout={onLayoutBuscador}
      >
        {buscador}
      </View>
    </View>
  );
});
