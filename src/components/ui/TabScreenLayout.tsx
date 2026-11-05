import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { NotificationBellButton } from "./NotificationBellButton";

/** Estructura común de las pestañas Chats y Favoritos: título, campana y scroll sobre el fondo de la app. */
export function TabScreenLayout({
  title,
  titleColor = "#101010",
  headerSpacing = 14,
  children,
}: {
  title: string;
  /** Color del título en tema claro (en oscuro siempre es claro). */
  titleColor?: string;
  /** Espacio entre el encabezado y el contenido. */
  headerSpacing?: number;
  children: ReactNode;
}) {
  const { styles, isDark } = useAppTheme();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={[
          styles.screenContent,
          {
            position: "relative",
            zIndex: 10,
            paddingTop: 20,
            paddingHorizontal: 15,
            paddingBottom: 100,
          },
        ]}
      >
        <View
          style={[
            styles.chatsHeader,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: headerSpacing,
            },
          ]}
        >
          <Text
            style={[
              styles.screenTitle,
              { color: isDark ? "#F1F5F9" : titleColor },
            ]}
          >
            {title}
          </Text>
          <NotificationBellButton />
        </View>

        {children}
      </ScrollView>
    </View>
  );
}
