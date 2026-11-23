import { Skeleton } from "heroui-native";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { coloresTarjetaVendedor } from "@/features/perfil/components/TarjetaVendedor";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Filas de tarjetas mientras cargan las publicaciones */
const FILAS = 3;

/** Una tarjeta de carga: avatar y nombre, la foto cuadrada, el título y el precio */
function TarjetaEsqueleto({ cardWidth }: { cardWidth: number }) {
  const { isDark } = useAppTheme();
  const margenFoto = cardWidth < 260 ? 6 : 8;
  const ladoFoto = Math.round(cardWidth - 6 - margenFoto * 2);
  return (
    <View
      style={[
        styles.tarjeta,
        {
          width: cardWidth,
          // El mismo fondo que la tarjeta de verdad (en oscuro, el de la tarjeta grande)
          backgroundColor: isDark
            ? coloresTarjetaVendedor(true).fondo
            : "#FAFAFA",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
        },
      ]}
    >
      <View style={styles.encabezado}>
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-2.5 w-1/2 rounded-md" />
      </View>
      <Skeleton
        className="rounded-2xl"
        style={{
          width: ladoFoto,
          height: ladoFoto,
          marginHorizontal: margenFoto,
        }}
      />
      <View style={styles.pie}>
        <Skeleton className="h-2.5 w-3/4 rounded-md" />
        <Skeleton className="h-2.5 w-2/5 rounded-md" />
      </View>
    </View>
  );
}

/**
 * Esqueleto de las publicaciones del inicio mientras cargan (el `Skeleton` de HeroUI, con su
 * brillo): tarjetas del mismo tamaño que las de verdad, de dos en dos.
 */
export const EsqueletoInicio = memo(function EsqueletoInicio({
  cardWidth,
}: {
  cardWidth: number;
}) {
  return (
    <View
      accessibilityLabel="Cargando publicaciones"
      accessibilityRole="progressbar"
      style={styles.contenedor}
    >
      {Array.from({ length: FILAS }, (_, fila) => (
        <View key={fila} style={styles.fila}>
          <TarjetaEsqueleto cardWidth={cardWidth} />
          <TarjetaEsqueleto cardWidth={cardWidth} />
        </View>
      ))}
    </View>
  );
});

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
  pie: { padding: 10, gap: 8 },
});
