import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { showErrorAlert } from "@/utils/alerts";
import { CarruselFondos } from "./CarruselFondos";
import { ALTO_CONTENIDO_SHEET, INTER, coloresEditar } from "./editarTema";
import { BotonGuardar } from "./BotonGuardar";
import { SheetEditar } from "./SheetEditar";

/** Fondos ya hechos para elegir */
const FONDOS = [
  require("@/assets/images/onbording/fondo1.jpeg"),
  require("@/assets/images/onbording/fondo2.jpeg"),
  require("@/assets/images/onbording/fondo3.jpeg"),
  require("@/assets/images/onbording/fondo4.jpeg"),
  require("@/assets/images/onbording/fondo5.jpeg"),
  require("@/assets/images/onbording/fondo6.jpeg"),
  require("@/assets/images/onbording/fondo7.jpeg"),
  require("@/assets/images/onbording/fondo8.jpeg"),
  require("@/assets/images/onbording/fondo9.jpeg"),
  require("@/assets/images/onbording/fondo10.jpeg"),
] as const;

/**
 * Drawer del fondo de perfil: carrusel de imágenes (la del centro es la elegida), Elegir
 * (galería) y Quitar (si ya hay fondo), y el botón "Usar este fondo".
 */
export function SheetFondo({
  visible,
  cover,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  /** Fondo puesto ahora (aparece primero en el carrusel) o `null` si no hay */
  cover: string | null;
  isDark: boolean;
  onClose: () => void;
  /** Guarda el fondo (`null` lo quita); si falla lanza (y ya avisó) */
  onGuardar: (cover: string | null) => Promise<void>;
}) {
  const { pickCoverImage, isPicking } = useImagePicker();
  const [centrado, setCentrado] = useState(0);
  // Con fondo puesto, ese es el primero del carrusel y los de la app van después
  const tieneFondo = cover !== null;
  const imagenes = useMemo(
    () => (cover ? [{ uri: cover }, ...FONDOS] : [...FONDOS]),
    [cover],
  );
  // Al abrir, el carrusel vuelve al fondo puesto (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  // Cuenta las aperturas: el carrusel se reinicia al abrir, nunca al cerrar (rehacerlo al
  // cerrar montaba todas sus imágenes justo mientras la card bajaba y trababa la salida)
  const [aperturas, setAperturas] = useState(0);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      setCentrado(0);
      setAperturas((n) => n + 1);
    }
  }
  /** El botón negro aparece al elegir otro; sin fondo puesto, siempre está */
  const hayCambio = !tieneFondo || centrado !== 0;
  const [guardando, setGuardando] = useState(false);

  const guardar = async (obtener: () => Promise<string | null>) => {
    if (guardando) return;
    setGuardando(true);
    try {
      let cover: string | null;
      try {
        cover = await obtener();
      } catch (error) {
        showErrorAlert("No se pudo preparar el fondo", error);
        return;
      }
      try {
        await onGuardar(cover);
      } catch {
        return; // Ya se avisó; se queda para reintentar
      }
      onClose();
    } finally {
      setGuardando(false);
    }
  };

  const usarCentrado = () =>
    guardar(async () => {
      const asset = await Asset.fromModule(
        FONDOS[centrado - (tieneFondo ? 1 : 0)],
      ).downloadAsync();
      return asset.localUri ?? asset.uri;
    });

  const elegir = async () => {
    if (isPicking || guardando) return;
    const cover = await pickCoverImage();
    if (!cover) return;
    void guardar(async () => cover);
  };

  return (
    <SheetEditar
      visible={visible}
      titulo="Fondo de perfil"
      isDark={isDark}
      onClose={onClose}
    >
      <View style={styles.inicio}>
        <CarruselFondos
          key={aperturas}
          imagenes={imagenes}
          onCambio={setCentrado}
        />

        <View style={styles.opciones}>
          <Opcion
            icono="images-outline"
            texto="Elegir"
            isDark={isDark}
            disabled={isPicking || guardando}
            onPress={() => void elegir()}
          />
          {tieneFondo ? (
            <Opcion
              icono="trash-outline"
              texto="Quitar"
              isDark={isDark}
              disabled={guardando}
              onPress={() => void guardar(async () => null)}
            />
          ) : null}
        </View>

        {hayCambio ? (
          <View style={styles.boton}>
            <BotonGuardar
              texto="Usar este fondo"
              isDark={isDark}
              guardando={guardando}
              atenuarAlGuardar
              onPress={() => void usarCentrado()}
            />
          </View>
        ) : null}
      </View>
    </SheetEditar>
  );
}

function Opcion({
  icono,
  texto,
  isDark,
  disabled,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  isDark: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const c = coloresEditar(isDark);
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.opcion,
        { backgroundColor: isDark ? "#17233A" : "#F2F2F2" },
      ]}
    >
      <Ionicons name={icono} size={20} color={c.texto} />
      <Text style={[INTER.medium, { fontSize: 14.5, color: c.texto }]}>
        {texto}
      </Text>
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  inicio: {
    alignItems: "center",
    gap: 22,
    paddingTop: 9,
    minHeight: ALTO_CONTENIDO_SHEET,
  },
  // Más abajo, pegadas al botón negro (que no se mueve): misma distancia que en el avatar
  opciones: {
    flexDirection: "row",
    marginTop: 10,
    gap: 15,
    paddingHorizontal: 17,
    alignSelf: "stretch",
  },
  opcion: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  boton: { alignSelf: "stretch", paddingHorizontal: 17, marginTop: -10 },
});
