import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { showErrorAlert } from "@/utils/alerts";
import { BotonPaso } from "../components/BotonPaso";
import { CarruselFondos } from "../components/CarruselFondos";
import { LETRA, SUBIR_CARRUSEL, coloresOnboarding } from "../temaOnboarding";

/** Fondos ya hechos para elegir; para agregar más basta con sumarlos a esta lista */
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
 * Paso del fondo de perfil: un carrusel de imágenes cuadradas como el de avatares (la del
 * centro es la elegida), Elegir (una foto de la galería) y Saltar, y abajo el botón negro
 * "Usar este fondo".
 */
export function PasoFondo({
  isDark,
  onGuardar,
  onContinuar,
}: {
  isDark: boolean;
  /** Guarda el fondo; si falla lanza (y ya avisó) */
  onGuardar: (cover: string) => Promise<void>;
  /** Pasa al siguiente paso */
  onContinuar: () => void;
}) {
  const { pickCoverImage, isPicking } = useImagePicker();
  const [centrado, setCentrado] = useState(0);
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
      if (!cover) return;
      try {
        await onGuardar(cover);
      } catch {
        return; // Ya se avisó; se queda para reintentar
      }
      onContinuar();
    } finally {
      setGuardando(false);
    }
  };

  /** Un fondo de la app se sube como una foto más: hace falta un archivo local */
  const usarCentrado = () =>
    guardar(async () => {
      const asset = await Asset.fromModule(FONDOS[centrado]).downloadAsync();
      return asset.localUri ?? asset.uri;
    });

  return (
    <View>
      <View style={styles.inicio}>
        <View
          style={{
            alignSelf: "stretch",
            transform: [{ translateY: -SUBIR_CARRUSEL }],
          }}
        >
          <CarruselFondos imagenes={FONDOS} onCambio={setCentrado} />
        </View>

        {/* Igual que Tomar / Elegir del avatar */}
        <View style={styles.opciones}>
          <Opcion
            icono="images-outline"
            texto="Elegir"
            isDark={isDark}
            disabled={isPicking || guardando}
            onPress={() =>
              void guardar(async () => (isPicking ? null : pickCoverImage()))
            }
          />
          <Opcion
            texto="Saltar"
            isDark={isDark}
            disabled={guardando}
            onPress={onContinuar}
          />
        </View>
      </View>

      <View style={styles.boton}>
        <BotonPaso
          texto="Usar este fondo"
          isDark={isDark}
          cargando={guardando}
          onPress={() => void usarCentrado()}
        />
      </View>
    </View>
  );
}

/** Botón de la fila de opciones: el mismo aspecto que Tomar / Elegir del avatar */
function Opcion({
  icono,
  texto,
  isDark,
  disabled,
  onPress,
}: {
  icono?: keyof typeof Ionicons.glyphMap;
  texto: string;
  isDark: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const c = coloresOnboarding(isDark);
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
      {icono ? <Ionicons name={icono} size={20} color={c.texto} /> : null}
      <Text style={[LETRA.medium, { fontSize: 14.5, color: c.texto }]}>
        {texto}
      </Text>
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  inicio: { alignItems: "center", gap: 22, paddingTop: 9 },
  opciones: {
    flexDirection: "row",
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
  boton: { paddingHorizontal: 17, marginTop: 18 },
});
