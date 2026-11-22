import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";

/** Fila larga de ajustes: icono + texto a la izquierda, switch o flecha a la derecha */
export function FilaAjuste({
  icon,
  label,
  right,
  onPress,
  bg,
  textColor,
}: {
  icon: ReactNode;
  label: string;
  right: ReactNode;
  onPress?: () => void;
  bg: string;
  textColor: string;
}) {
  const content = (
    <>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
      {right}
    </>
  );

  // Sin onPress (filas con switch o con círculos) la fila no es botón: el control recibe el toque
  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: bg }]}>{content}</View>;
  }
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, { backgroundColor: bg }]}
    >
      {content}
    </PressableSuave>
  );
}

/**
 * Opciones de una tarjeta (ajustes del perfil y de Editar perfil) separadas por una línea
 * fina que abarca todo el ancho de la tarjeta.
 */
export function ListaAjustes({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  const filas = Children.toArray(children);
  return (
    <View>
      {filas.map((fila, indice) => (
        <Fragment key={indice}>
          {indice > 0 ? (
            <View
              style={[
                styles.linea,
                { backgroundColor: isDark ? "#ffffff1f" : "rgba(0,0,0,0.09)" },
              ]}
            />
          ) : null}
          {fila}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // configuracion del contenido de las tarjetas de General y Legal
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 55,
    borderRadius: 17,
    // La tarjeta ya no tiene relleno a los lados: el contenido queda donde estaba (4 + 15)
    paddingHorizontal: 19,
    gap: 13.5,
  },
  rowIcon: { width: 20, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  // De borde a borde de la tarjeta
  linea: { height: StyleSheet.hairlineWidth },
});
