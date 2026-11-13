import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState, type Dispatch, type SetStateAction } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/features/shared/Text";
import { SeccionEtiquetas } from "../drawer/SeccionEtiquetas";
import { TecladoSheetCtx } from "../drawer/InputSheet";
import { nuevoId } from "../drawer/drawerTheme";
import {
  COLORES_PERFIL,
  MAX_PILDORAS,
  type ColorPerfil,
  type PildoraPerfilData,
} from "../Perfiltemas";
import { INTER } from "./editarTema";
import { SheetEditar } from "./SheetEditar";

/** Drawer de etiquetas: se editan como borrador y se guardan con un solo botón */
export function SheetEtiquetas({
  visible,
  pills,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  pills: PildoraPerfilData[];
  isDark: boolean;
  onClose: () => void;
  onGuardar: (pills: PildoraPerfilData[]) => Promise<void>;
}) {
  return (
    <SheetEditar visible={visible} titulo="Etiquetas" isDark={isDark} onClose={onClose}>
      <Contenido
        visible={visible}
        pills={pills}
        isDark={isDark}
        onClose={onClose}
        onGuardar={onGuardar}
      />
    </SheetEditar>
  );
}

/**
 * Cambios sobre un borrador de etiquetas (agregar, color, icono, quitar), con el máximo y
 * los colores de Editar perfil. Lo comparten este drawer y el onboarding.
 */
export function accionesBorradorEtiquetas(
  setBorrador: Dispatch<SetStateAction<PildoraPerfilData[]>>,
) {
  return {
    agregar: (text: string, icon?: string) =>
      setBorrador((curr) => {
        if (curr.length >= MAX_PILDORAS) return curr;
        const color = COLORES_PERFIL[curr.length % COLORES_PERFIL.length];
        return [...curr, { id: nuevoId(), text, color, icon }];
      }),
    cambiarColor: (id: string, color: ColorPerfil) =>
      setBorrador((curr) =>
        curr.map((x) => (x.id === id ? { ...x, color } : x)),
      ),
    cambiarIcono: (id: string, icon?: string) =>
      setBorrador((curr) => curr.map((x) => (x.id === id ? { ...x, icon } : x))),
    quitar: (id: string) =>
      setBorrador((curr) => curr.filter((x) => x.id !== id)),
  };
}

/** Va dentro del sheet para poder avisarle del teclado */
function Contenido({
  visible,
  pills,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  pills: PildoraPerfilData[];
  isDark: boolean;
  onClose: () => void;
  onGuardar: (pills: PildoraPerfilData[]) => Promise<void>;
}) {
  const teclado = useBottomSheetAwareHandlers();
  const [borrador, setBorrador] = useState(pills);
  const [guardando, setGuardando] = useState(false);

  // Al abrir, el borrador parte de las etiquetas guardadas
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) setBorrador(pills);
  }

  const { agregar, cambiarColor, cambiarIcono, quitar } =
    accionesBorradorEtiquetas(setBorrador);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onGuardar(borrador);
      onClose();
    } catch {
      // El error ya se mostró; el drawer se queda abierto para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <TecladoSheetCtx.Provider value={teclado}>
      <View style={styles.wrap}>
        <SeccionEtiquetas
          pills={borrador}
          modo={isDark ? "oscuro" : "claro"}
          onAdd={agregar}
          onColor={cambiarColor}
          onIcon={cambiarIcono}
          onRemove={quitar}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => void guardar()}
          style={[styles.boton, { backgroundColor: isDark ? "#F1F5F9" : "#1C1C1E" }]}
        >
          {guardando ? (
            <ActivityIndicator color={isDark ? "#101010" : "#FFFFFF"} />
          ) : (
            <Text style={[INTER.medium, { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" }]}>
              Guardar
            </Text>
          )}
        </Pressable>
      </View>
    </TecladoSheetCtx.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 16 },
  boton: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
