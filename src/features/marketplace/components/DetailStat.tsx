import { View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Dato destacado del detalle de una publicación (calificación, distancia, categoría). */
export function DetailStat({ value, label }: { value: string; label: string }) {
  const { styles } = useAppTheme();
  return (
    <View style={styles.stat}>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}
