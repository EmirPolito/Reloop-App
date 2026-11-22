import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import {
  THREAD_HEADER_CONTENT_HEIGHT,
  THREAD_HEADER_Z,
} from "@/features/chats/threadLayout";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { BackArrowIcon, CategoryIcon } from "./ThreadIcons";

/**
 * Encabezado flotante del chat: volver, contacto (abre su perfil) y menú. Los botones son los
 * redondos de cristal de los demás módulos (Chats, Favoritos...), del mismo tamaño.
 */
export function ThreadHeader({
  contactId,
  contactName,
  onBack,
  onOpenProfile,
  onOpenMenu,
}: {
  /** uid del contacto: de ahí sale su avatar de ahora y si tiene insignia */
  contactId: string;
  contactName: string;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
}) {
  const { isDark, styles } = useAppTheme();
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? "#FFFFFF" : "#101010";
  // Blanco sólido en claro: el cristal translúcido tomaba el gris de la capa del encabezado
  const fondoBoton = isDark ? undefined : "#FFFFFF";
  const isIOS = Platform.OS === "ios";

  // iOS: el blur hace el vidrio, el tinte es suave.
  // Android: sin blur real, el tinte es más fuerte para que se lea bien.
  const tint = isIOS
    ? isDark
      ? "#16161666"
      : "#ffffff40"
    : isDark
      ? "#161616cc"
      : "#f6f6f6ae";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.threadHeader,
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: THREAD_HEADER_Z,
          elevation: THREAD_HEADER_Z,
          shadowColor: "transparent",
          height: insets.top + THREAD_HEADER_CONTENT_HEIGHT,
          paddingTop: insets.top,
          paddingHorizontal: 15,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          backgroundColor: tint,
          borderWidth: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? "#ffffff22" : "#f6f6f644",
        },
      ]}
    >
      {isIOS && (
        <BlurView
          intensity={isDark ? 40 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <BotonBarra
        etiqueta="Volver a los chats"
        onPress={onBack}
        fondo={fondoBoton}
      >
        <View style={{ transform: [{ translateX: -1.5 }] }}>
          <BackArrowIcon size={28} color={iconColor} />
        </View>
      </BotonBarra>

      {/* Centro: avatar (abre el perfil) + nombre del contacto debajo */}
      <View style={{ alignItems: "center", flex: 1, marginHorizontal: 10 }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${contactName}`}
          onPress={onOpenProfile}
          scaleTo={0.94}
        >
          <AvatarVendedor
            ownerId={contactId}
            fallbackName={contactName}
            size={45}
          />
        </PressableScale>

        <Text
          numberOfLines={1}
          style={[
            styles.threadContactName,
            {
              textAlign: "center",
              fontWeight: "500",
              fontSize: 12.5,
              marginTop: 3,
            },
          ]}
        >
          {contactName}
        </Text>
      </View>

      {/* Botón derecho de menú */}
      <BotonBarra
        etiqueta="Más opciones"
        onPress={onOpenMenu}
        fondo={fondoBoton}
      >
        <View style={{ transform: [{ translateY: -0.5 }] }}>
          <CategoryIcon size={22} color={iconColor} />
        </View>
      </BotonBarra>
    </View>
  );
}
