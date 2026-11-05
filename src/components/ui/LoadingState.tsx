import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/** Indicador de carga centrado, para listas y pantallas que esperan datos. */
export function LoadingState({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando"
      style={[styles.container, style]}
    >
      <ActivityIndicator color="#0785FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
});
