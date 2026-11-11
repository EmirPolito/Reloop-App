import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { getInitials } from "@/utils/text";
import { AjustarFoto } from "./AjustarFoto";
import { CamaraCircular, type FotoTomada } from "./CamaraCircular";
import { DURACION_EDITAR, INTER, coloresEditar } from "./editarTema";
import { SheetEditar } from "./SheetEditar";

type Paso = "inicio" | "camara" | "ajustar";

const TITULOS: Record<Paso, string> = {
  inicio: "Cambiar avatar",
  camara: "Tomar foto",
  ajustar: "Ajustar foto",
};

/** Cambiar avatar: elegir cómo (Tomar / Elegir), la cámara y el ajuste, en un solo drawer */
export function SheetAvatar({
  visible,
  photo,
  name,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  photo: string | null;
  name: string;
  isDark: boolean;
  onClose: () => void;
  /** Recibe la foto ya recortada; si lanza error, el drawer se queda abierto */
  onGuardar: (uri: string) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const { pickImageWithSize, isPicking } = useImagePicker();
  const [paso, setPaso] = useState<Paso>("inicio");
  const [origen, setOrigen] = useState<"camara" | "galeria">("camara");
  const [foto, setFoto] = useState<FotoTomada | null>(null);

  // Cada vez que se abre empieza desde el principio (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      setPaso("inicio");
      setFoto(null);
    }
  }

  // La galería se abre encima del drawer (ver disableFullWindowOverlay en SheetEditar)
  const elegir = async () => {
    if (isPicking) return;
    const elegida = await pickImageWithSize();
    if (!elegida) return;
    setOrigen("galeria");
    setFoto(elegida);
    setPaso("ajustar");
  };

  const tomar = () => {
    setOrigen("camara");
    setPaso("camara");
  };

  const volver =
    paso === "inicio"
      ? undefined
      : () =>
          setPaso(
            paso === "ajustar" && origen === "camara" ? "camara" : "inicio",
          );

  return (
    <SheetEditar
      visible={visible}
      titulo={TITULOS[paso]}
      isDark={isDark}
      onClose={onClose}
      onBack={volver}
      permitirArrastrarContenido={paso !== "ajustar"}
    >
      <Animated.View
        key={paso}
        entering={FadeIn.duration(DURACION_EDITAR)}
        exiting={FadeOut.duration(120)}
      >
        {paso === "inicio" ? (
          <View style={styles.inicio}>
            <View style={[styles.avatar, { backgroundColor: c.avatarFondo }]}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  contentFit="cover"
                  transition={200}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <Text style={[INTER.medium, { fontSize: 40, color: c.texto }]}>
                  {getInitials(name)}
                </Text>
              )}
            </View>

            <View style={styles.opciones}>
              <Opcion
                icono="camera-outline"
                texto="Tomar"
                isDark={isDark}
                onPress={tomar}
              />
              <Opcion
                icono="images-outline"
                texto="Elegir"
                isDark={isDark}
                disabled={isPicking}
                onPress={() => void elegir()}
              />
            </View>
          </View>
        ) : null}

        {paso === "camara" ? (
          <CamaraCircular
            isDark={isDark}
            onTomada={(tomada) => {
              setFoto(tomada);
              setPaso("ajustar");
            }}
          />
        ) : null}

        {paso === "ajustar" && foto ? (
          <AjustarFoto
            // Foto nueva = encuadre nuevo (zoom, posición y medidas desde cero)
            key={foto.uri}
            foto={foto}
            isDark={isDark}
            textoSecundario={origen === "camara" ? "Repetir" : "Elegir otra"}
            onSecundario={
              origen === "camara"
                ? () => setPaso("camara")
                : () => void elegir()
            }
            onGuardar={async (uri) => {
              await onGuardar(uri);
              onClose();
            }}
          />
        ) : null}
      </Animated.View>
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
  inicio: { alignItems: "center", gap: 26, paddingTop: 15 },
  avatar: {
    width: 125,
    height: 125,
    borderRadius: 60,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
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
});
