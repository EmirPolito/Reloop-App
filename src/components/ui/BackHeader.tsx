import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";

/** Barra superior con botón "Volver" y título centrado. */
export function BackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { styles, isDark } = useAppTheme();
  return (
    <View style={[styles.backHeader, { paddingTop: insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={onBack}
        style={styles.backButton}
      >
        <AppIcon name="back" size={22} color={isDark ? "#FFFFFF" : "#23242C"} />
      </Pressable>
      <Text numberOfLines={1} style={styles.backTitle}>
        {title}
      </Text>
      <View style={styles.backButton} />
    </View>
  );
}
