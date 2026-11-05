import { Pressable, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { TextInput } from "@/features/shared/Text";

/** Buscador de conversaciones con botón para limpiar el texto. */
export function ChatSearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const { isDark, styles } = useAppTheme();
  return (
    <View
      style={[
        styles.chatSearch,
        {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 15,
          height: 50,
          paddingHorizontal: 15,
          borderRadius: 30,
          borderWidth: 2,
          borderBlockColor: isDark ? "#ffffff22" : "#ffffff6d",
          backgroundColor: isDark ? "#1E293B" : "#ffffff5b",
        },
      ]}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          marginRight: -4,
        }}
      >
        <AppIcon
          name="search"
          size={16}
          color={isDark ? "#E3DEED" : "#828690"}
        />
      </View>

      <TextInput
        accessibilityLabel="Buscar conversaciones"
        value={value}
        onChangeText={onChangeText}
        placeholder="Buscar conversaciones..."
        placeholderTextColor={isDark ? "#B3AEC0" : "#696969ff"}
        returnKeyType="search"
        style={[
          styles.chatSearchInput,
          {
            flex: 1,
            height: "100%",
            fontSize: 13.5,
            paddingTop: 5,
            paddingBottom: 0,
            textAlignVertical: "center",
            color: isDark ? "#FFFFFF" : "#1F2937",
          },
        ]}
      />

      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda de chats"
          onPress={() => onChangeText("")}
          style={{
            padding: 6,
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <AppIcon
            name="close"
            size={18}
            color={isDark ? "#B3AEC0" : "#8e8e8eff"}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
