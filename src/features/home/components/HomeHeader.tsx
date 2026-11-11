import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import {
  ArrowRightIcon,
  LocationIcon,
  SearchIcon,
  StarIcon,
} from "@/features/shared/PillIcons";
import { Text, TextInput } from "@/features/shared/Text";

/** Cabecera del inicio: logo, comunidad, buscador y filtro. */
export const HomeHeader = memo(function HomeHeader({
  query,
  onChangeQuery,
  onClearCategory,
}: {
  query: string;
  onChangeQuery: (query: string) => void;
  onClearCategory: () => void;
}) {
  // styles solo se usa para el logo; isDark para props que no son estilos
  const { styles, isDark } = useAppTheme();

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between gap-3 pt-[5px]">
        <View className="flex-1 min-w-0 flex-row items-center gap-2">
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/logoo.png")}
            contentFit="contain"
            style={styles.brandLogo}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          className="min-h-9.5 flex-row items-center gap-1 px-2.5 rounded-full bg-white"
        >
          <LocationIcon size={18} color="#101010" />
          <Text className="mr-3 text-[11px] font-semibold text-black/90">
            UTSV
          </Text>
          <ArrowRightIcon size={16} color="#1c77ffff" />
        </Pressable>
      </View>

      <View className="mt-3 mb-1">
        <View className="bg-white flex-row items-center gap-2 min-h-13 px-1.5 py-1 pl-4 rounded-full">
          <SearchIcon size={20} color={isDark ? "#E3DEED" : "#828690"} />
          <TextInput
            accessibilityLabel="Buscar productos"
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Buscar..."
            placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
            returnKeyType="search"
            className="flex-1 min-w-0 py-2 font-[500] text-[14px] text-[#23242C] dark:text-[#F5F4FA]"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver destacadas"
            onPress={onClearCategory}
            className="h-9 flex-row items-center gap-1 px-2 rounded-full bg-[#E8E8EA] active:opacity-70"
          >
            <StarIcon size={15} color="#888888ff" />
            <Text className="text-[10.5px] font-[500] text-[#888888ff]">
              Destacadas
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});
