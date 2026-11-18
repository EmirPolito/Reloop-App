import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { PressableScale } from "@/components/PressableScale";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { IconoEditar } from "@/features/perfil/Perfiliconos";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { republishProduct } from "../productRepository";
import type { Product } from "../types";

const COLOR_ELIMINAR = "#E5484D";
const LADO = 34;
const GIRO = { duration: 520, easing: Easing.out(Easing.cubic) };

/** Dos flechas en círculo (republicar) — Lucide "repeat-2" */
function IconoRepetir({ size = 20, color = "#000000" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m2 9 3-3 3 3" />
      <Path d="M13 18H7a2 2 0 0 1-2-2V6" />
      <Path d="m22 15-3 3-3-3" />
      <Path d="M11 6h6a2 2 0 0 1 2 2v10" />
    </Svg>
  );
}

/**
 * Lo que va debajo de la foto de una publicación en el perfil propio, en lugar del avatar,
 * el título y el precio: republicar, editar y eliminar. Republicar gira su icono 360° al
 * tocarlo y, si no se pudo, lo gira otra vez en sentido contrario; en ambos casos avisa arriba.
 */
export function AccionesPublicacion({
  item,
  onEditar,
  onEliminar,
}: {
  item: Product;
  onEditar: (item: Product) => void;
  onEliminar: (item: Product) => void;
}) {
  const { isDark } = useAppTheme();
  const { mostrar } = useAvisos();
  const giro = useSharedValue(0);
  const ocupado = useRef(false);

  const estiloGiro = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.get()}deg` }],
  }));

  const republicar = async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    // Gira 360° hacia adelante al tocarlo
    giro.set(withTiming(giro.get() + 360, GIRO));
    try {
      await republishProduct(item.id);
      mostrar({
        tipo: "exito",
        titulo: "Publicación republicada",
        descripcion: `"${item.name}" se republicó correctamente.`,
      });
    } catch (error) {
      // No se pudo: gira 360° en sentido contrario
      giro.set(withTiming(giro.get() - 360, GIRO));
      mostrar({
        tipo: "error",
        titulo: "No se pudo republicar",
        descripcion: describeFirestoreError(error),
      });
    } finally {
      ocupado.current = false;
    }
  };

  const fondo = isDark ? "#ffffff14" : "#F1F1F3";
  const icono = isDark ? "#E2E8F0" : "#3F3F46";

  return (
    <View style={estilos.fila}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Republicar"
        onPress={() => void republicar()}
        scaleTo={0.9}
        style={[estilos.boton, { backgroundColor: fondo }]}
      >
        <Animated.View style={estiloGiro}>
          <IconoRepetir size={18} color={icono} />
        </Animated.View>
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Editar"
        onPress={() => onEditar(item)}
        scaleTo={0.9}
        style={[estilos.boton, { backgroundColor: fondo }]}
      >
        <IconoEditar size={18} color={icono} />
      </PressableScale>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Eliminar"
        onPress={() => onEliminar(item)}
        scaleTo={0.9}
        style={[
          estilos.boton,
          { backgroundColor: isDark ? "rgba(229,72,77,0.18)" : "#FDECEC" },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color={COLOR_ELIMINAR} />
      </PressableScale>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  boton: {
    width: LADO,
    height: LADO,
    borderRadius: LADO / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
