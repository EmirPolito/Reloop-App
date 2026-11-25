import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { NeblinaDesenfocada } from "@/features/busqueda/components/NeblinaDesenfocada";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import {
  THREAD_HEADER_CONTENT_HEIGHT,
  THREAD_HEADER_Z,
} from "@/features/chats/medidasConversacion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import {
  ANCHO_BOTON_BILLETERA,
  BotonBilletera,
} from "@/features/tarjetas/components/BotonBilletera";
import { BackArrowIcon } from "./IconosConversacion";

/** Fuera de iOS, lo que la neblina baja por debajo del encabezado al desvanecerse */
const COLA_NEBLINA = 56;

/**
 * Encabezado flotante del chat: volver, contacto (abre su perfil) y la billetera para mandar
 * una tarjeta. Volver es el botón redondo de cristal de los demás módulos (Chats, Favoritos...).
 */
export function CabeceraConversacion({
  contactId,
  contactName,
  onBack,
  onOpenProfile,
  onOpenWallet,
}: {
  /** uid del contacto: de ahí sale su avatar de ahora y si tiene insignia */
  contactId: string;
  contactName: string;
  onBack: () => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
}) {
  const { isDark, styles } = useAppTheme();
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? "#FFFFFF" : "#101010";
  // Blanco sólido en claro: el cristal translúcido tomaba el gris de la capa del encabezado
  const fondoBoton = isDark ? undefined : "#FFFFFF";
  const isIOS = Platform.OS === "ios";
  const altoCabecera = insets.top + THREAD_HEADER_CONTENT_HEIGHT;

  // iOS: el blur hace el vidrio, el tinte es suave
  const tint = isDark ? "#16161666" : "#ffffff40";

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
          height: altoCabecera,
          paddingTop: insets.top,
          paddingHorizontal: 15,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 0,
        },
        // Fuera de iOS la banda gris con orilla recta se veía sucia: ahí va la neblina por
        // capas del tono de la pantalla, que baja un poco de más y se desvanece
        isIOS
          ? {
              overflow: "hidden",
              backgroundColor: tint,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? "#ffffff22" : "#f6f6f644",
            }
          : { overflow: "visible", backgroundColor: "transparent" },
      ]}
    >
      {!isIOS && (
        <NeblinaDesenfocada
          alto={altoCabecera + COLA_NEBLINA}
          inicioVelo={altoCabecera - 24}
          inicioDesenfoque={altoCabecera - 24}
          // Sin que se vea tan nublado: el velo deja ver más lo de atrás
          opacidadVelo={0.55}
        />
      )}
      {isIOS && (
        <BlurView
          intensity={isDark ? 40 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Del ancho de la billetera, para que el contacto quede centrado */}
      <View style={{ width: ANCHO_BOTON_BILLETERA }}>
        <BotonBarra
          etiqueta="Volver a los chats"
          onPress={onBack}
          fondo={fondoBoton}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={iconColor} />
          </View>
        </BotonBarra>
      </View>

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

      {/* La billetera: abre las tarjetas para mandar una */}
      <BotonBilletera onPress={onOpenWallet} />
    </View>
  );
}
