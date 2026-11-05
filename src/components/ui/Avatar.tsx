import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { getInitials } from "@/utils/text";

/** Círculo con las iniciales de una persona. `style` y `textStyle` ajustan variantes. */
export function Avatar({
  name,
  size = 42,
  style,
  textStyle,
}: {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { styles } = useAppTheme();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.avatarInitials, textStyle]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
