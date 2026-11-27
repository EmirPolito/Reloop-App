import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { EASE_OUT_CUBIC } from "@/constants/motion";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { coloresPedido } from "../colores";
import {
  formatearDinero,
  piezasDe,
  totalDe,
  type ItemPedido,
} from "../formatoPedido";

const TRANSICION_SUAVE = LinearTransition.duration(260).easing(EASE_OUT_CUBIC);

/**
- El resumen antes de pedir: "Total" con su flecha y, al abrirlo, cada producto elegido con su
- cantidad y el subtotal.
 */
export function ResumenPedido({ items }: { items: readonly ItemPedido[] }) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const [abierto, setAbierto] = useState(false);
  const total = totalDe(items);
  const piezas = piezasDe(items);

  const flecha = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(abierto ? "180deg" : "0deg", {
          duration: 260,
          easing: EASE_OUT_CUBIC,
        }),
      },
    ],
  }));

  return (
    // Sin fondo propio: va directo sobre la pantalla con transición suave de altura
    <Animated.View layout={TRANSICION_SUAVE} style={styles.contenedor}>
      {/* "Total: $X" a la izquierda y la flecha a la derecha. Sin achicarse al tocarlo: se
          sentía como un rebote */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={abierto ? "Ocultar el desglose" : "Ver el desglose"}
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto((valor) => !valor)}
        style={styles.totalFila}
      >
        <Text style={[INTER.semibold, styles.total, { color: c.texto }]}>
          Total: {formatearDinero(total)}
        </Text>
        <Animated.View style={flecha}>
          <Ionicons name="chevron-down" size={18} color={c.texto} />
        </Animated.View>
      </Pressable>

      {abierto ? (
        <Animated.View
          entering={FadeIn.duration(240).easing(EASE_OUT_CUBIC)}
          exiting={FadeOut.duration(160).easing(EASE_OUT_CUBIC)}
          style={styles.desglose}
        >
          {/* En iPhone un borde punteado de un solo lado sale continuo: se dibuja un borde
              punteado completo y se deja ver solo su línea de arriba */}
          <View style={styles.punteada}>
            <View style={[styles.punteadaBorde, { borderColor: c.linea }]} />
          </View>
          {items.length === 0 ? (
            <Text style={[INTER.regular, styles.linea, { color: c.suave }]}>
              Aún no eliges productos.
            </Text>
          ) : (
            items.map((item) => (
              <View key={item.nombre} style={styles.fila}>
                <Text
                  numberOfLines={1}
                  style={[
                    INTER.regular,
                    styles.linea,
                    styles.nombre,
                    { color: c.suave },
                  ]}
                >
                  {item.cantidad} × {item.nombre}
                </Text>
                <Text style={[INTER.medium, styles.linea, { color: c.texto }]}>
                  {formatearDinero(item.precio * item.cantidad)}
                </Text>
              </View>
            ))
          )}
          <View style={styles.fila}>
            <Text style={[INTER.regular, styles.linea, { color: c.suave }]}>
              Subtotal ({piezas} {piezas === 1 ? "producto" : "productos"})
            </Text>
            <Text style={[INTER.medium, styles.linea, { color: c.texto }]}>
              {formatearDinero(total)}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: { overflow: "hidden" },
  // Un poco más arriba (menos aire encima)
  totalFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 14,
  },
  total: { fontSize: 16 },
  desglose: { gap: 10, paddingBottom: 16 },
  punteada: { height: 1, overflow: "hidden", marginBottom: 4 },
  punteadaBorde: { height: 4, borderWidth: 1, borderStyle: "dashed" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nombre: { flex: 1 },
  linea: { fontSize: 13.5 },
});
