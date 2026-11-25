import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT_CUBIC } from "@/constants/motion";
import { coloresPedido } from "@/features/pedidos/colores";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import type { Resena } from "../formatoResena";
import { Estrellas } from "./Estrellas";

const ENTRADA = FadeIn.duration(260).easing(EASE_OUT_CUBIC);

function BotonFlecha({
  direccion,
  onPress,
}: {
  direccion: "anterior" | "siguiente";
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={
        direccion === "anterior" ? "Reseña anterior" : "Reseña siguiente"
      }
      onPress={onPress}
      scaleTo={0.9}
      style={[
        styles.flecha,
        { backgroundColor: isDark ? "#0A0A0A" : "#171717" },
      ]}
    >
      <Ionicons
        name={direccion === "anterior" ? "chevron-back" : "chevron-forward"}
        size={16}
        color="#FFFFFF"
      />
    </PressableScale>
  );
}

/**
 * Las reseñas de una publicación de venta o comida: una a la vez (estrellas, nombre y lo que
 * escribió quien compró), con flechas para pasar a la anterior o la siguiente.
 */
export function TarjetaResenas({
  resenas,
  promedio,
}: {
  resenas: readonly Resena[];
  /** Promedio de la publicación (puede venir antes que las reseñas) */
  promedio?: number;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const [indice, setIndice] = useState(0);
  const total = resenas.length;
  const actual = resenas[Math.min(indice, total - 1)];

  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
          Reseñas
        </Text>
        {total > 0 ? (
          <Text style={[INTER.regular, styles.resumen, { color: c.suave }]}>
            {(promedio ?? 0).toFixed(1)} · {total}{" "}
            {total === 1 ? "reseña" : "reseñas"}
          </Text>
        ) : null}
      </View>

      <View style={[styles.tarjeta, { backgroundColor: c.neutro }]}>
        {actual ? (
          <>
            <Animated.View
              key={actual.autorId}
              entering={ENTRADA}
              style={styles.cuerpo}
            >
              <Estrellas valor={actual.estrellas} tamano="md" />
              <Text style={[INTER.semibold, styles.autor, { color: c.texto }]}>
                {actual.autor}
              </Text>
              <Text style={[INTER.regular, styles.cita, { color: c.suave }]}>
                “{actual.texto}”
              </Text>
            </Animated.View>
            {total > 1 ? (
              <View style={styles.flechas}>
                <BotonFlecha
                  direccion="anterior"
                  onPress={() => setIndice((i) => (i - 1 + total) % total)}
                />
                <BotonFlecha
                  direccion="siguiente"
                  onPress={() => setIndice((i) => (i + 1) % total)}
                />
              </View>
            ) : null}
          </>
        ) : (
          <Text style={[INTER.regular, styles.vacio, { color: c.suave }]}>
            Aún no hay reseñas. Las escriben quienes compran, cuando el vendedor
            se lo pide en el chat.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 12 },
  encabezado: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  titulo: { fontSize: 16 },
  resumen: { fontSize: 13 },
  tarjeta: { borderRadius: 18, padding: 20, gap: 18 },
  cuerpo: { gap: 10 },
  autor: { fontSize: 15.5 },
  cita: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  flechas: { flexDirection: "row", gap: 10 },
  flecha: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  vacio: { fontSize: 13.5, lineHeight: 20 },
});
