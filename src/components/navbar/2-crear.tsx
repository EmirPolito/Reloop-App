import { memo, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { NavigationIcon } from "@/components/iconos";
import { APARECER, TAMANO_ICONO_CREAR, type Estilos } from "./estilos";
import { SuperficieCristal } from "./SuperficieCristal";

/** El botón redondo de crear, a la derecha de la cápsula: abre y cierra el menú de crear */
export const BotonCrear = memo(function BotonCrear({
  selected,
  onPress,
  isDark,
  styles,
}: {
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  styles: Estilos;
}) {
  const activo = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    activo.set(withTiming(selected ? 1 : 0, APARECER));
  }, [selected, activo]);

  const inactiveStyle = useAnimatedStyle(() => ({ opacity: 1 - activo.get() }));
  const activeStyle = useAnimatedStyle(() => ({ opacity: activo.get() }));

  const colorInactivo = isDark ? "#A1A1AA" : "#52525B";
  const colorActivo = isDark ? "#F1F5F9" : "#101010";

  return (
    <View style={[styles.sombra, styles.crearSombra]}>
      <View style={styles.crearCirculo}>
        <SuperficieCristal isDark={isDark} styles={styles} />
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ selected }}
          accessibilityLabel="Publicar producto"
          onPress={onPress}
          scaleTo={0.93}
          style={styles.hueco}
        >
          <View style={styles.iconoCrear}>
            <Animated.View style={[styles.iconoCapa, inactiveStyle]}>
              <NavigationIcon
                name="add"
                size={TAMANO_ICONO_CREAR}
                color={colorInactivo}
              />
            </Animated.View>
            <Animated.View style={[styles.iconoCapa, activeStyle]}>
              <NavigationIcon
                name="add"
                size={TAMANO_ICONO_CREAR}
                color={colorActivo}
              />
            </Animated.View>
          </View>
        </PressableScale>
      </View>
    </View>
  );
});
