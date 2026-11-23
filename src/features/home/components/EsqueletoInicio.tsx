import { StyleSheet, View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Filas de tarjetas grises mientras cargan las publicaciones */
const FILAS = 3;

/**
 * Esqueleto de las publicaciones del inicio mientras cargan: tarjetas grises del mismo
 * tamaño que las de verdad (foto cuadrada, nombre y precio), de dos en dos.
 */
export function EsqueletoInicio({ cardWidth }: { cardWidth: number }) {
  const { isDark } = useAppTheme();
  const fondo = isDark ? "#1B2230" : "#FAFAFA";
  const borde = isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF";
  const gris = isDark ? "#273449" : "#ECECEE";
  const margenFoto = cardWidth < 260 ? 6 : 8;
  const ladoFoto = Math.round(cardWidth - 6 - margenFoto * 2);

  return (
    <View
      accessibilityLabel="Cargando publicaciones"
      accessibilityRole="progressbar"
      style={styles.contenedor}
    >
      {Array.from({ length: FILAS }, (_, fila) => (
        <View key={fila} style={styles.fila}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[
                styles.tarjeta,
                {
                  width: cardWidth,
                  backgroundColor: fondo,
                  borderColor: borde,
                },
              ]}
            >
              {/* Avatar y nombre */}
              <View style={styles.encabezado}>
                <View style={[styles.avatar, { backgroundColor: gris }]} />
                <View
                  style={[
                    styles.barra,
                    { width: "45%", backgroundColor: gris },
                  ]}
                />
              </View>
              {/* Foto */}
              <View
                style={[
                  styles.foto,
                  {
                    width: ladoFoto,
                    height: ladoFoto,
                    marginHorizontal: margenFoto,
                    backgroundColor: gris,
                  },
                ]}
              />
              {/* Título y precio */}
              <View style={styles.pie}>
                <View
                  style={[
                    styles.barra,
                    { width: "70%", backgroundColor: gris },
                  ]}
                />
                <View
                  style={[
                    styles.barra,
                    { width: "40%", backgroundColor: gris },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 16 },
  fila: { flexDirection: "row", gap: 16 },
  tarjeta: { borderRadius: 22, borderWidth: 3, overflow: "hidden" },
  encabezado: {
    height: 50,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  foto: { borderRadius: 18 },
  pie: { padding: 10, gap: 8 },
  barra: { height: 10, borderRadius: 5 },
});
