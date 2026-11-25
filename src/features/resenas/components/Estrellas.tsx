import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { INTER } from "@/features/perfil/editar/editarTema";
import { Text } from "@/features/shared/Text";
import { etiquetaEstrellas } from "../formatoResena";

const AMARILLO = "#FFC107";
const PASOS = [1, 2, 3, 4, 5] as const;
const TAMANOS = { sm: 16, md: 26, lg: 34 } as const;

function Estrella({
  paso,
  valor,
  tamano,
  apagada,
  onElegir,
}: {
  paso: number;
  valor: number;
  tamano: number;
  apagada: string;
  onElegir?: (valor: number) => void;
}) {
  const escala = useSharedValue(1);
  const llena = valor >= paso;
  const media = !llena && valor >= paso - 0.5;

  // Al elegir, las estrellas llenas "saltan" una tras otra, en ola
  useEffect(() => {
    if (!onElegir || !llena) return;
    escala.set(
      withDelay(
        (paso - 1) * 45,
        withSequence(
          withTiming(1.22, { duration: 110 }),
          withSpring(1, { duration: 320, dampingRatio: 0.7 }),
        ),
      ),
    );
  }, [valor, llena, paso, onElegir, escala]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));

  const icono = (
    <Animated.View style={estilo}>
      <Ionicons
        name={llena ? "star" : media ? "star-half" : "star-outline"}
        size={tamano}
        color={llena || media ? AMARILLO : apagada}
      />
    </Animated.View>
  );
  if (!onElegir) return icono;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: valor === paso }}
      accessibilityLabel={`${etiquetaEstrellas(paso)}, ${paso} de 5 estrellas`}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onElegir(paso);
      }}
      onPressIn={() => escala.set(withTiming(0.86, { duration: 90 }))}
      onPressOut={() => escala.set(withSpring(1, { duration: 260 }))}
      hitSlop={4}
      style={styles.celda}
    >
      {icono}
    </Pressable>
  );
}

/**
 * Estrellas de 1 a 5. Con `onChange` se eligen (cada una es un botón de radio, con la palabra
 * del valor a un lado); sin él solo se muestran, con medias estrellas para un promedio.
 */
export function Estrellas({
  valor,
  onChange,
  tamano = "md",
  mostrarEtiqueta = false,
  colorApagada = "#C7C7C7",
  colorEtiqueta = "#8A8A8A",
}: {
  valor: number;
  onChange?: (valor: number) => void;
  tamano?: keyof typeof TAMANOS;
  mostrarEtiqueta?: boolean;
  colorApagada?: string;
  colorEtiqueta?: string;
}) {
  return (
    <View
      accessibilityRole={onChange ? "radiogroup" : "image"}
      accessibilityLabel={
        onChange ? "Calificación" : `${valor.toFixed(1)} de 5 estrellas`
      }
      style={styles.fila}
    >
      <View style={[styles.estrellas, { gap: onChange ? 0 : 2 }]}>
        {PASOS.map((paso) => (
          <Estrella
            key={paso}
            paso={paso}
            valor={valor}
            tamano={TAMANOS[tamano]}
            apagada={colorApagada}
            onElegir={onChange}
          />
        ))}
      </View>
      {mostrarEtiqueta ? (
        <Text
          numberOfLines={1}
          style={[INTER.medium, styles.etiqueta, { color: colorEtiqueta }]}
        >
          {etiquetaEstrellas(valor)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Si no cabe, la palabra baja completa debajo de las estrellas
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 10,
  },
  estrellas: { flexDirection: "row", alignItems: "center" },
  celda: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: { fontSize: 13.5 },
});
