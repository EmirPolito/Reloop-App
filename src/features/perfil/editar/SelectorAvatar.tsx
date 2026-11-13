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

export type PasoAvatar = "inicio" | "camara" | "ajustar";

export const TITULOS_AVATAR: Record<PasoAvatar, string> = {
  inicio: "Cambiar avatar",
  camara: "Tomar foto",
  ajustar: "Ajustar foto",
};

type GuardarAvatar = (
  cambios: Pick<DatosPerfil, "photo" | "orb">,
) => Promise<void>;

/**
 * Estado del cambio de avatar (carrusel de orbes, Tomar / Elegir, cámara y ajuste). Lo
 * comparten el drawer de Editar perfil (`SheetAvatar`) y el onboarding, que solo cambian
 * el contenedor. `onListo` se llama después de guardar.
 */
export function useFlujoAvatar({
  photo,
  orb,
  onGuardar,
  onListo,
}: {
  photo: string | null;
  orb: number | null;
  /** Recibe la foto ya recortada o el orbe elegido; si lanza error, el flujo sigue abierto */
  onGuardar: GuardarAvatar;
  onListo: () => void;
}) {
  const { pickImageWithSize, isPicking } = useImagePicker();
  const [paso, setPaso] = useState<PasoAvatar>("inicio");
  const [origen, setOrigen] = useState<"camara" | "galeria">("camara");
  const [foto, setFoto] = useState<FotoTomada | null>(null);
  // Avatar centrado en el carrusel: 0 es la foto actual (o las iniciales) y de 1 a 10 son los orbes
  const guardado = indiceDeAvatar(photo, orb);
  const [centrado, setCentrado] = useState(guardado);
  const [guardando, setGuardando] = useState(false);

  /** Vuelve al principio (al abrir el drawer) */
  const reiniciar = () => {
    setPaso("inicio");
    setFoto(null);
    setCentrado(guardado);
  };

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

  const alTomar = (tomada: FotoTomada) => {
    setFoto(tomada);
    setPaso("ajustar");
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
      onListo();
    } catch {
      // El aviso ya lo mostró quien guarda; el flujo sigue abierto para reintentar
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

  const guardarFoto = async (uri: string) => {
    await onGuardar({ photo: uri, orb });
    onListo();
  };

  return {
    paso,
    setPaso,
    origen,
    foto,
    guardado,
    setCentrado,
    /** El carrusel quedó en un avatar distinto del guardado */
    hayCambio: centrado !== guardado,
    guardando,
    isPicking,
    reiniciar,
    elegir,
    tomar,
    alTomar,
    usarAvatar,
    volver,
    guardarFoto,
  };
}

export type FlujoAvatar = ReturnType<typeof useFlujoAvatar>;

/**
 * Contenido del cambio de avatar: el carrusel con los orbes, Tomar / Elegir y "Usar este
 * avatar"; la cámara; y el ajuste de la foto. Sin contenedor: va dentro del drawer de
 * Editar perfil o de un paso del onboarding.
 */
export function SelectorAvatar({
  flujo,
  photo,
  name,
  isDark,
  claveCarrusel,
  mostrarConfirmar = true,
}: {
  flujo: FlujoAvatar;
  photo: string | null;
  name: string;
  isDark: boolean;
  /** Al cambiar, el carrusel vuelve a montarse en el avatar guardado */
  claveCarrusel: string;
  /** Botón "Usar este avatar" (el onboarding guarda con su propio Continuar) */
  mostrarConfirmar?: boolean;
}) {
  const c = coloresEditar(isDark);
  const { guardarFoto, hayCambio } = flujo;

  return (
    <Animated.View
      key={flujo.paso}
      entering={FadeIn.duration(DURACION_EDITAR)}
      exiting={FadeOut.duration(120)}
    >
      {flujo.paso === "inicio" ? (
        <View style={styles.inicio}>
          <CarruselAvatares
            photo={photo}
            name={name}
            isDark={isDark}
            // Al reabrir el drawer el carrusel vuelve al avatar guardado
            key={claveCarrusel}
            inicial={flujo.guardado}
            onCambio={flujo.setCentrado}
          />

          <View style={styles.opciones}>
            <Opcion
              icono="camera-outline"
              texto="Tomar"
              isDark={isDark}
              onPress={flujo.tomar}
            />
            <Opcion
              icono="images-outline"
              texto="Elegir"
              isDark={isDark}
              disabled={flujo.isPicking}
              onPress={() => void flujo.elegir()}
            />
          </View>

          {mostrarConfirmar && hayCambio ? (
            <Animated.View
              entering={FadeIn.duration(DURACION_EDITAR)}
              exiting={FadeOut.duration(120)}
              style={styles.confirmar}
            >
              <PressableSuave
                accessibilityRole="button"
                accessibilityLabel="Usar este avatar"
                accessibilityState={{
                  disabled: flujo.guardando,
                  busy: flujo.guardando,
                }}
                disabled={flujo.guardando}
                onPress={() => void flujo.usarAvatar()}
                style={[
                  styles.confirmarBoton,
                  { backgroundColor: c.texto },
                  flujo.guardando && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={[
                    INTER.medium,
                    { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" },
                  ]}
                >
                  {flujo.guardando ? "Guardando…" : "Usar este avatar"}
                </Text>
              </PressableSuave>
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      {flujo.paso === "camara" ? (
        <CamaraCircular
          isDark={isDark}
          onTomada={(tomada) => {
            flujo.alTomar(tomada);
          }}
        />
      ) : null}

      {flujo.paso === "ajustar" && flujo.foto ? (
        <AjustarFoto
          // Foto nueva = encuadre nuevo (zoom, posición y medidas desde cero)
          key={flujo.foto.uri}
          foto={flujo.foto}
          isDark={isDark}
          textoSecundario={
            flujo.origen === "camara" ? "Repetir" : "Elegir otra"
          }
          onSecundario={
            flujo.origen === "camara"
              ? () => flujo.setPaso("camara")
              : () => void flujo.elegir()
          }
          onGuardar={guardarFoto}
        />
      ) : null}
    </Animated.View>
  );
}

/** Botón Tomar / Elegir (también lo usa la portada del onboarding) */
export function Opcion({
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
