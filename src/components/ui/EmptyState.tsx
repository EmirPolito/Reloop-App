import { View, type StyleProp, type ViewStyle } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import type { IconName } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";

/** Estado vacío dentro de una tarjeta, con icono del sistema. */
export function EmptyState({
  title,
  message,
  icon = "sell",
  style,
}: {
  title: string;
  message: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={[styles.emptyState, style]}>
      <AppIcon name={icon} size={31} color="#0785FF" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}
