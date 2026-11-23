import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Quienes fundaron ReLoop */
const FUNDADORES = [
  "Emir Polito Guevara",
  "Irving Esteban Molina Méndez",
  "Cristian Daniel Barraza Hernández",
];

/** Cierre de "Acerca de la app", como el final de unos créditos: el logo y los fundadores */
export function CreditosFundadores() {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";
  // En oscuro, claro pero no tanto (el gris azulado de antes casi no se leía)
  const suave = isDark ? "#C4C7CC" : "#6B6B6B";

  return (
    <View style={styles.contenedor}>
      <Image
        accessibilityLabel="ReLoop"
        source={require("@/assets/images/logos-reloop/logoo.png")}
        contentFit="contain"
        // En oscuro el logo va en blanco para que se lea
        tintColor={isDark ? "#FFFFFF" : undefined}
        style={styles.logo}
      />
      <Text style={[styles.etiqueta, { color: suave }]}>Fundadores</Text>
      <View style={styles.nombres}>
        {FUNDADORES.map((nombre) => (
          <Text key={nombre} style={[styles.nombre, { color: texto }]}>
            {nombre}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", marginTop: -8 },
  // Misma proporción que el logo del inicio (92 × 38)
  logo: { width: 138, height: 57 },
  etiqueta: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 11.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  nombres: { marginTop: 12, alignItems: "center", gap: 6 },
  nombre: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
