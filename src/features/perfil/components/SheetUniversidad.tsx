import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { UNIVERSIDADES } from "@/features/marketplace/universidades";
import { Text } from "@/features/shared/Text";
import { HOST_SESION, SheetEditar } from "../editar/SheetEditar";
import { ListaAjustes } from "./FilaAjuste";

const AZUL_ELEGIDA = "#1c77ff";

/**
 * Drawer para cambiar de universidad (desde los ajustes del perfil): las universidades sueltas
 * sobre el drawer (sin tarjeta), separadas por una línea como las opciones del perfil. Elegir una cambia las
 * publicaciones del inicio a las de esa universidad y cierra el drawer.
 */
export function SheetUniversidad({
  visible,
  universidad,
  isDark,
  onElegir,
  onClose,
}: {
  visible: boolean;
  /** Id de la universidad elegida */
  universidad: string;
  isDark: boolean;
  onElegir: (id: string) => void;
  onClose: () => void;
}) {
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const colorSuave = isDark ? "#C4C7CC" : "#7A7D88";

  return (
    <SheetEditar
      visible={visible}
      titulo="Universidad"
      isDark={isDark}
      onClose={onClose}
      hostName={HOST_SESION}
    >
      <View style={styles.cuerpo}>
        <ListaAjustes isDark={isDark}>
          {UNIVERSIDADES.map((u) => {
            const elegida = u.id === universidad;
            return (
              <PressableSuave
                key={u.id}
                accessibilityRole="button"
                accessibilityState={{ selected: elegida }}
                accessibilityLabel={`${u.sigla}, ${u.nombre}`}
                onPress={() => {
                  onElegir(u.id);
                  onClose();
                }}
                style={styles.fila}
              >
                <View
                  style={[
                    styles.iniciales,
                    {
                      backgroundColor: elegida
                        ? AZUL_ELEGIDA
                        : isDark
                          ? "rgba(255,255,255,0.12)"
                          : "#EDEDF0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inicialesTexto,
                      { color: elegida ? "#FFFFFF" : colorTexto },
                    ]}
                  >
                    {u.sigla.slice(0, 3)}
                  </Text>
                </View>
                <View style={styles.textos}>
                  <Text
                    numberOfLines={1}
                    style={[styles.nombre, { color: colorTexto }]}
                  >
                    {u.sigla}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.descripcion, { color: colorSuave }]}
                  >
                    {u.nombre}
                  </Text>
                </View>
                {elegida ? (
                  <Ionicons name="checkmark" size={20} color={AZUL_ELEGIDA} />
                ) : null}
              </PressableSuave>
            );
          })}
        </ListaAjustes>
      </View>
    </SheetEditar>
  );
}

const styles = StyleSheet.create({
  // Metidas: más margen a los lados, las opciones y sus líneas no llegan a la orilla
  cuerpo: { paddingHorizontal: 34, paddingTop: 4, paddingBottom: 16 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    // Un poco de aire entre opciones, sin volver a lo extendido de antes
    minHeight: 58,
    // Sin tarjeta: el contenido alineado con las líneas
    paddingHorizontal: 2,
  },
  iniciales: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inicialesTexto: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  textos: { flex: 1, minWidth: 0, gap: 1 },
  nombre: { fontFamily: "Inter_500Medium", fontSize: 15 },
  descripcion: { fontFamily: "Inter_400Regular", fontSize: 12.5 },
});
