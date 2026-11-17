import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { memo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import {
  ETIQUETA_BUSQUEDA,
  PISTA_BUSQUEDA,
} from "@/features/busqueda/frasesBusqueda";
import { PlaceholderRotativo } from "@/features/busqueda/components/PlaceholderRotativo";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { IconoBusqueda } from "./IconosTarjeta";
import { SelectorUniversidad } from "./SelectorUniversidad";

/**
 * Cabecera del inicio: logo, comunidad, buscador y filtro. El buscador encuentra productos
 * o, si el texto empieza con "@", personas; un chip indica el modo activo.
 */
export const HomeHeader = memo(function HomeHeader({
  query,
  onChangeQuery,
}: {
  query: string;
  onChangeQuery: (query: string) => void;
}) {
  // styles solo se usa para el logo; isDark para props que no son estilos
  const { styles, isDark } = useAppTheme();
  const [enfocado, setEnfocado] = useState(false);
  const buscaUsuarios = modoDeBusqueda(query).modo === "usuarios";

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between gap-3 pt-[5px]">
        {/* Logo — lado izquierdo */}
        <View className="flex-1 min-w-0 flex-row items-center gap-2">
          <Image
            accessibilityLabel="Logo ReLoop"
            source={require("@/assets/images/logoo.png")}
            contentFit="contain"
            style={styles.brandLogo}
          />
        </View>

        {/* Lado derecho: el círculo de la universidad (abre su menú) a la izquierda de la campana */}
        <View className="flex-row items-center gap-2">
          <SelectorUniversidad />
          <NotificationBellButton />
        </View>
      </View>

      <View className="mt-5 mb-1">
        {/* Card de cristal: translúcida y desenfocada, como la de iniciar sesión */}
        <View
          style={[
            estilos.buscador,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : Platform.OS === "android"
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(255,255,255,0.62)",
            },
          ]}
        >
          {Platform.OS !== "android" ? (
            <BlurView
              intensity={8}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <IconoBusqueda size={22} color={isDark ? "#E3DEED" : "#4A4D57"} />
          <View className="flex-1 min-w-0 justify-center">
            <PlaceholderRotativo
              activo={!enfocado && query === ""}
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 15,
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
              className="flex-1 min-w-0 py-2 font-[500] text-[15px] text-[#23242C] dark:text-[#F5F4FA]"
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
        </View>
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  // Más alto que antes y con el borde de luz de la card de cristal
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
});
