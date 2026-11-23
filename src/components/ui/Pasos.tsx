import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Text } from "@/features/shared/Text";

/** Lado del círculo de cada paso */
const LADO = 26;
/** Aire entre el círculo y la línea que lo une con el siguiente */
const AIRE_LINEA = 6;
/** Lo que tarda la línea en llenarse y el círculo en cambiar de color */
const LLENAR = { duration: 340, easing: Easing.bezier(0, 0, 0.2, 1) };
/** El halo del paso actual entra con un rebote suave */
const REBOTE = { damping: 14, stiffness: 220 };

/** Colores estilo iOS, según el tema */
function coloresPasos(isDark: boolean) {
  return {
    tinte: isDark ? "#0A84FF" : "#007AFF",
    relleno: isDark ? "rgba(120, 120, 128, 0.36)" : "rgba(120, 120, 128, 0.2)",
    halo: isDark ? "rgba(10, 132, 255, 0.28)" : "rgba(0, 122, 255, 0.18)",
    numero: isDark ? "rgba(235, 235, 245, 0.6)" : "rgba(60, 60, 67, 0.6)",
    titulo: isDark ? "#F1F5F9" : "#101010",
    tituloSuave: isDark ? "rgba(235, 235, 245, 0.6)" : "rgba(60, 60, 67, 0.6)",
  };
}

type Colores = ReturnType<typeof coloresPasos>;
type Estado = "completo" | "actual" | "pendiente";

const Paso = memo(function Paso({
  titulo,
  indice,
  estado,
  ultimo,
  colores,
}: {
  titulo: string;
  indice: number;
  estado: Estado;
  ultimo: boolean;
  colores: Colores;
}) {
  // 1 cuando el paso ya se alcanzó (completo o actual): el círculo se pinta del tinte
  const alcanzado = useSharedValue(estado === "pendiente" ? 0 : 1);
  // La línea hacia el siguiente se llena cuando este paso queda completo
  const lleno = useSharedValue(estado === "completo" ? 1 : 0);
  const halo = useSharedValue(estado === "actual" ? 1 : 0);

  useEffect(() => {
    alcanzado.set(withTiming(estado === "pendiente" ? 0 : 1, LLENAR));
    lleno.set(withTiming(estado === "completo" ? 1 : 0, LLENAR));
    halo.set(withSpring(estado === "actual" ? 1 : 0, REBOTE));
  }, [estado, alcanzado, lleno, halo]);

  const circuloEstilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      alcanzado.get(),
      [0, 1],
      [colores.relleno, colores.tinte],
    ),
  }));
  const haloEstilo = useAnimatedStyle(() => ({
    opacity: halo.get(),
    transform: [{ scale: 0.6 + 0.4 * halo.get() }],
  }));
  const llenoEstilo = useAnimatedStyle(() => ({
    width: `${lleno.get() * 100}%`,
  }));

  return (
    <View style={estilos.paso}>
      {ultimo ? null : (
        <View style={[estilos.linea, { backgroundColor: colores.relleno }]}>
          <Animated.View
            style={[
              estilos.lineaLlena,
              { backgroundColor: colores.tinte },
              llenoEstilo,
            ]}
          />
        </View>
      )}

      <View style={estilos.marcador}>
        <Animated.View
          style={[estilos.halo, { backgroundColor: colores.halo }, haloEstilo]}
        />
        <Animated.View style={[estilos.circulo, circuloEstilo]}>
          {estado === "completo" ? (
            <Animated.View entering={ZoomIn.duration(200)}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Text
              style={[
                estilos.numero,
                {
                  color: estado === "actual" ? "#FFFFFF" : colores.numero,
                },
              ]}
            >
              {indice + 1}
            </Text>
          )}
        </Animated.View>
      </View>

      <Text
        numberOfLines={1}
        style={[
          estado === "actual" ? estilos.tituloActual : estilos.titulo,
          {
            color: estado === "actual" ? colores.titulo : colores.tituloSuave,
          },
        ]}
      >
        {titulo}
      </Text>
    </View>
  );
});

/**
 * Indicador de pasos numerados (una configuración, un proceso por partes). Los pasos hechos
 * llevan palomita, el actual un halo y los que faltan quedan apagados. La línea entre dos
 * pasos se llena al completarse, así que avanzar se ve como la línea que se rellena.
 */
export function Pasos({
  titulos,
  actual,
  isDark,
  style,
}: {
  titulos: string[];
  /** Índice (desde 0) del paso en curso */
  actual: number;
  isDark: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colores = coloresPasos(isDark);
  const faltan = titulos.length - actual - 1;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Paso ${actual + 1} de ${titulos.length}: ${titulos[actual]}. ${
        faltan === 0 ? "Es el último" : `Faltan ${faltan}`
      }`}
      style={[estilos.fila, style]}
    >
      {titulos.map((titulo, indice) => (
        <Paso
          key={titulo}
          titulo={titulo}
          indice={indice}
          estado={
            indice < actual
              ? "completo"
              : indice === actual
                ? "actual"
                : "pendiente"
          }
          ultimo={indice === titulos.length - 1}
          colores={colores}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row" },
  paso: { flex: 1, alignItems: "center", gap: 6 },
  // De la orilla de este círculo a la del siguiente (los pasos miden lo mismo)
  linea: {
    position: "absolute",
    top: LADO / 2 - 1.5,
    left: "50%",
    right: "-50%",
    marginHorizontal: LADO / 2 + AIRE_LINEA,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  lineaLlena: { height: "100%", borderRadius: 1.5 },
  marcador: {
    width: LADO,
    height: LADO,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: LADO + 10,
    height: LADO + 10,
    borderRadius: (LADO + 10) / 2,
  },
  circulo: {
    width: LADO,
    height: LADO,
    borderRadius: LADO / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  numero: { fontFamily: "Inter_600SemiBold", fontSize: 12.5 },
  titulo: { fontFamily: "Inter_500Medium", fontSize: 11.5 },
  tituloActual: { fontFamily: "Inter_600SemiBold", fontSize: 11.5 },
});
