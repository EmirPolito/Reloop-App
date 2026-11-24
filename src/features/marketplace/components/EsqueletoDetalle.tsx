import { Skeleton } from "heroui-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";

/**
 * Una publicación mientras se lee: la misma forma que el detalle de verdad (la foto grande con
 * el botón de volver encima y la tarjeta con quien publica, título, precio, descripción, las
 * estadísticas y los botones), así al llegar los datos nada cambia de lugar. Antes solo había
 * una ruedita bajo un encabezado que el detalle ni siquiera tiene.
 */
export function EsqueletoDetalle({ onBack }: { onBack: () => void }) {
  const { styles, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityLabel="Cargando publicación"
      accessibilityRole="progressbar"
      style={styles.fill}
    >
      <View style={styles.detailHero}>
        <Skeleton className="w-full rounded-none" style={estilos.foto} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack}
          style={[styles.detailBack, { top: insets.top + 10 }]}
        >
          <AppIcon
            name="back"
            size={21}
            color={isDark ? "#FFFFFF" : "#23242C"}
          />
        </Pressable>
      </View>

      <View style={[styles.detailCard, estilos.tarjeta]}>
        <View style={styles.sellerRow}>
          <Skeleton className="size-11 rounded-full" />
          <View style={estilos.vendedor}>
            <Skeleton className="h-3 w-2/5 rounded-md" />
            <Skeleton className="h-2.5 w-3/5 rounded-md" />
          </View>
        </View>
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-6 w-1/3 rounded-md" />
        <View style={estilos.descripcion}>
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
        </View>
        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[68px] flex-1 rounded-[20px]" />
          ))}
        </View>
        <View style={styles.detailActions}>
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </View>
      </View>
    </View>
  );
}

// Las mismas medidas que `detailImage`, `sellerRow` y `detailDescription` de los estilos
const estilos = StyleSheet.create({
  foto: {
    height: 340,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  tarjeta: { gap: 6 },
  vendedor: { flex: 1, gap: 6 },
  descripcion: { marginTop: 4, gap: 6 },
});
