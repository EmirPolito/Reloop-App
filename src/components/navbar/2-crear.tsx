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

/** Mismo fondo que el botón de enviar mensaje del chat */
const COLOR_BOTON_ENVIAR = "#11a8ffff";

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

  // Sobre el fondo oscuro del botón de enviar el ícono va claro en ambos temas
  const colorInactivo = "#ffffffff";
  const colorActivo = "#FFFFFF";

  return (
    <View style={[styles.sombra, styles.crearSombra]}>
      <View
        style={[styles.crearCirculo, { backgroundColor: COLOR_BOTON_ENVIAR }]}
      >
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
