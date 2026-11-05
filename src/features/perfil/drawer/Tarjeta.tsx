import { type ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { Text } from "@/features/shared/Text";
import { TIPO, PALETA, LAYOUT, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";

export function Tarjeta({
  modo,
  title,
  description,
  counter,
  animarAlto = false,
  children,
}: {
  modo: Modo;
  title: string;
  description?: string;
  counter?: string;
  animarAlto?: boolean;
  children: ReactNode;
}) {
  const p = PALETA[modo];
  return (
    <Animated.View
      layout={animarAlto ? LAYOUT : undefined}
      style={[styles.card, { backgroundColor: p.tarjeta }]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={{ fontSize: TIPO.titulo, fontWeight: "700", color: p.texto }}
        >
          {title}
        </Text>
        {counter ? (
          <Text
            style={{
              fontSize: TIPO.contador,
              fontWeight: "500",
              color: p.suave,
            }}
          >
            {counter}
          </Text>
        ) : null}
      </View>
      {description ? (
        <Text
          style={[
            styles.description,
            { fontSize: TIPO.descripcion, color: p.suave },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {children}
    </Animated.View>
  );
}
