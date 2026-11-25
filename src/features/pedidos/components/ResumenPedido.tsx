import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
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

/**
 * El resumen antes de pedir: "Total" con su flecha y, al abrirlo, cada producto elegido con su
 * cantidad y el subtotal.
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
          duration: 220,
          easing: EASE_OUT_CUBIC,
        }),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.tarjeta,
        // Fondo blanco, sin borde
        { backgroundColor: c.tarjeta },
      ]}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={abierto ? "Ocultar el desglose" : "Ver el desglose"}
        accessibilityState={{ expanded: abierto }}
        onPress={() => setAbierto((valor) => !valor)}
        scaleTo={0.98}
        style={styles.totalFila}
      >
        <View style={styles.totalTexto}>
          <Text style={[INTER.semibold, styles.total, { color: c.texto }]}>
            Total
          </Text>
          <Animated.View style={flecha}>
            <Ionicons name="chevron-down" size={17} color={c.texto} />
          </Animated.View>
        </View>
        <Text style={[INTER.semibold, styles.total, { color: c.texto }]}>
          {formatearDinero(total)}
        </Text>
      </PressableScale>

      {abierto ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.desglose}>
          <View style={[styles.punteada, { borderColor: c.linea }]} />
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
          <View style={styles.fila}>
            <Text style={[INTER.regular, styles.linea, { color: c.suave }]}>
              Entrega
            </Text>
            <Text style={[INTER.medium, styles.linea, { color: c.texto }]}>
              Se acuerda en el chat
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderRadius: 18, paddingHorizontal: 16 },
  totalFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  totalTexto: { flexDirection: "row", alignItems: "center", gap: 6 },
  total: { fontSize: 16 },
  desglose: { gap: 10, paddingBottom: 16 },
  punteada: { borderTopWidth: 1, borderStyle: "dashed", marginBottom: 4 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  nombre: { flex: 1 },
  linea: { fontSize: 13.5 },
});
