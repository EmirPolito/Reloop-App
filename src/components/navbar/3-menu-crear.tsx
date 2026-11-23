import { useMemo } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import {
  IconoAnuncios,
  IconoPublicaciones,
} from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";
import { ALTO_CAPSULA, type Estilos } from "./estilos";
import { SuperficieCristal } from "./SuperficieCristal";

const COLOR_ICONO_ANUNCIO = "#ec8e29ff";
const COLOR_ICONO_PUBLICACION = "#ff3762";

/**
 * El menú que sale sobre el botón de crear: crear anuncio o publicación. Aparece desde la
 * esquina de abajo a la derecha según `menu` (0 cerrado, 1 abierto).
 */
export function MenuCrear({
  visible,
  menu,
  isDark,
  bottom,
  onAnuncio,
  onPublicacion,
  styles,
}: {
  visible: boolean;
  menu: SharedValue<number>;
  isDark: boolean;
  /** Dónde está la barra: el menú queda 10 px sobre ella */
  bottom: number;
  onAnuncio: () => void;
  onPublicacion: () => void;
  styles: Estilos;
}) {
  const opcionesStyle = useAnimatedStyle(() => ({
    opacity: menu.get(),
    transform: [
      { translateY: (1 - menu.get()) * 10 },
      { scale: 0.94 + 0.06 * menu.get() },
    ],
  }));

  const opciones = useMemo(
    () => [
      {
        label: "Crear anuncio",
        Icono: IconoAnuncios,
        color: COLOR_ICONO_ANUNCIO,
        onPress: onAnuncio,
      },
      {
        label: "Crear publicación",
        Icono: IconoPublicaciones,
        color: COLOR_ICONO_PUBLICACION,
        onPress: onPublicacion,
      },
    ],
    [onAnuncio, onPublicacion],
  );

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.menuSombra,
        { bottom: bottom + ALTO_CAPSULA + 10 },
        opcionesStyle,
      ]}
    >
      <View style={styles.menuCard}>
        <SuperficieCristal isDark={isDark} styles={styles} />
        {opciones.map(({ label, Icono, color, onPress }, index) => (
          <PressableSuave
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
            scaleTo={0.97}
            style={[styles.menuOpcion, index > 0 && styles.menuOpcionSeparador]}
          >
            <Text style={styles.menuEtiqueta}>{label}</Text>
            <Icono size={22} color={color} />
          </PressableSuave>
        ))}
      </View>
    </Animated.View>
  );
}
