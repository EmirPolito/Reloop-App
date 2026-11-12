import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import type { DatosPerfil } from "../Perfiltemas";
import { AjustarFoto } from "./AjustarFoto";
import { CamaraCircular, type FotoTomada } from "./CamaraCircular";
import { CarruselAvatares, indiceDeAvatar } from "./CarruselAvatares";
import { DURACION_EDITAR, INTER, coloresEditar } from "./editarTema";
import { SheetEditar } from "./SheetEditar";

type Paso = "inicio" | "camara" | "ajustar";

const TITULOS: Record<Paso, string> = {
  inicio: "Cambiar avatar",
  camara: "Tomar foto",
  ajustar: "Ajustar foto",
};

/**
 * Cambiar avatar: un carrusel con los avatares orbe, elegir una foto (Tomar / Elegir), la
 * cámara y el ajuste, en un solo drawer
 */
export function SheetAvatar({
  visible,
  photo,
  orb,
  name,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  photo: string | null;
  orb: number | null;
  name: string;
  isDark: boolean;
  onClose: () => void;
  /** Recibe la foto ya recortada o el orbe elegido; si lanza error, el drawer se queda abierto */
  onGuardar: (cambios: Pick<DatosPerfil, "photo" | "orb">) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const { pickImageWithSize, isPicking } = useImagePicker();
  const [paso, setPaso] = useState<Paso>("inicio");
  const [origen, setOrigen] = useState<"camara" | "galeria">("camara");
  const [foto, setFoto] = useState<FotoTomada | null>(null);
  // Posición del carrusel: 0 es la foto actual (o las iniciales) y de 1 a 10 son los orbes
  const guardado = indiceDeAvatar(photo, orb);
  const [centrado, setCentrado] = useState(guardado);
  const [guardando, setGuardando] = useState(false);

  // Cada vez que se abre empieza desde el principio (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      setPaso("inicio");
      setFoto(null);
      setCentrado(guardado);
    }
  }

  // La galería se abre encima del drawer (ver disableFullWindowOverlay en SheetEditar)
  const elegir = async () => {
    if (isPicking) return;
    const elegida = await pickImageWithSize();
    if (!elegida) return;
    setOrigen("galeria");
    setFoto(elegida);
    setCentrado(guardado);
    setPaso("ajustar");
  };

  const tomar = () => {
    setOrigen("camara");
    setCentrado(guardado);
    setPaso("camara");
  };

  // Elegir un orbe quita la foto; volver a la posición 0 sin foto deja solo las iniciales
  const usarAvatar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onGuardar({
        photo: centrado === 0 ? photo : null,
        orb: centrado === 0 ? null : centrado - 1,
      });
      onClose();
    } catch {
      // El aviso ya lo mostró quien guarda; el drawer sigue abierto para reintentar
    } finally {
      setGuardando(false);
    }
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
            <CarruselAvatares
              photo={photo}
              name={name}
              isDark={isDark}
              // Al reabrir el drawer el carrusel vuelve al avatar guardado
              key={visible ? "abierto" : "cerrado"}
              inicial={guardado}
              onCambio={setCentrado}
            />

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

            {centrado !== guardado ? (
              <Animated.View
                entering={FadeIn.duration(DURACION_EDITAR)}
                exiting={FadeOut.duration(120)}
                style={styles.confirmar}
              >
                <PressableSuave
                  accessibilityRole="button"
                  accessibilityLabel="Usar este avatar"
                  accessibilityState={{ disabled: guardando, busy: guardando }}
                  disabled={guardando}
                  onPress={() => void usarAvatar()}
                  style={[
                    styles.confirmarBoton,
                    { backgroundColor: c.texto },
                    guardando && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      INTER.medium,
                      { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" },
                    ]}
                  >
                    {guardando ? "Guardando…" : "Usar este avatar"}
                  </Text>
                </PressableSuave>
              </Animated.View>
            ) : null}
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
              await onGuardar({ photo: uri, orb });
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
  inicio: { alignItems: "center", gap: 22, paddingTop: 9 },
  confirmar: { alignSelf: "stretch", paddingHorizontal: 17, marginTop: -7 },
  confirmarBoton: {
    height: 50,
    borderRadius: 30,
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
