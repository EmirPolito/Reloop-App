import { Image } from "expo-image";
import { memo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import {
  ETIQUETA_BUSQUEDA,
  PISTA_BUSQUEDA,
} from "@/features/busqueda/frasesBusqueda";
import { PlaceholderRotativo } from "@/features/busqueda/components/PlaceholderRotativo";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import {
  ArrowRightIcon,
  LocationIcon,
  SearchIcon,
  StarIcon,
} from "@/features/shared/PillIcons";
import { Text, TextInput } from "@/features/shared/Text";

/**
 * Cabecera del inicio: logo, comunidad, buscador y filtro. El buscador encuentra productos
 * o, si el texto empieza con "@", personas; un chip indica el modo activo.
 */
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
  const [enfocado, setEnfocado] = useState(false);
  const buscaUsuarios = modoDeBusqueda(query).modo === "usuarios";

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
          <View className="flex-1 min-w-0 justify-center">
            <PlaceholderRotativo
              activo={!enfocado && query === ""}
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 14,
                color: isDark ? "#B3AEC0" : "#828690",
              }}
            />
            <TextInput
              accessibilityLabel={ETIQUETA_BUSQUEDA}
              accessibilityHint={PISTA_BUSQUEDA}
              value={query}
              onChangeText={onChangeQuery}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              autoCapitalize="none"
              autoCorrect={!buscaUsuarios}
              returnKeyType="search"
              className="flex-1 min-w-0 py-2 font-[500] text-[14px] text-[#23242C] dark:text-[#F5F4FA]"
            />
          </View>
          {buscaUsuarios ? (
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
              accessible
              accessibilityLabel="Buscando personas"
              style={{
                height: 36,
                justifyContent: "center",
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: "#E8F1FF",
              }}
            >
              <Text className="text-[11px] font-[600] text-[#1c77ff]">
                @ Personas
              </Text>
            </Animated.View>
          ) : null}
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
