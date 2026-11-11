import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { Text } from "@/features/shared/Text";
import { INTER, LADO_CIRCULO, coloresEditar } from "./editarTema";

export interface FotoTomada {
  uri: string;
  width: number;
  height: number;
}

/** Cámara frontal dentro de un círculo y, debajo, solo el botón para tomar la foto */
export function CamaraCircular({
  isDark,
  onTomada,
}: {
  isDark: boolean;
  onTomada: (foto: FotoTomada) => void;
}) {
  const c = coloresEditar(isDark);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camaraRef = useRef<CameraView>(null);
  const [lista, setLista] = useState(false);
  const [tomando, setTomando] = useState(false);

  if (!permiso) {
    return <View style={styles.circulo} />;
  }

  if (!permiso.granted) {
    return (
      <View style={styles.permiso}>
        <Text style={[INTER.regular, { fontSize: 13.5, color: c.suave, textAlign: "center" }]}>
          Permite el acceso a la cámara para tomar tu foto de perfil.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void pedirPermiso()}
          style={[styles.botonPermiso, { backgroundColor: c.texto }]}
        >
          <Text style={[INTER.semibold, { fontSize: 14, color: isDark ? "#101010" : "#FFFFFF" }]}>
            Permitir cámara
          </Text>
        </Pressable>
      </View>
    );
  }

  const tomar = async () => {
    if (!lista || tomando) return;
    setTomando(true);
    try {
      const foto = await camaraRef.current?.takePictureAsync({ quality: 0.85 });
      if (foto) onTomada({ uri: foto.uri, width: foto.width, height: foto.height });
    } catch (error) {
      console.warn("No se pudo tomar la foto.", error);
    } finally {
      setTomando(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.circulo, { backgroundColor: c.avatarFondo }]}>
        <CameraView
          ref={camaraRef}
          facing="front"
          mirror
          style={StyleSheet.absoluteFill}
          onCameraReady={() => setLista(true)}
        />
        {!lista ? <ActivityIndicator style={StyleSheet.absoluteFill} color={c.suave} /> : null}
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Tomar foto"
        scaleTo={0.92}
        onPress={() => void tomar()}
        style={[styles.disparo, { borderColor: c.texto }]}
      >
          {tomando ? (
            <ActivityIndicator color={c.texto} />
          ) : (
            <View style={[styles.disparoCentro, { backgroundColor: c.texto }]} />
          )}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 22, paddingTop: 6 },
  circulo: {
    width: LADO_CIRCULO,
    height: LADO_CIRCULO,
    borderRadius: LADO_CIRCULO / 2,
    overflow: "hidden",
    alignSelf: "center",
  },
  disparo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  disparoCentro: { width: 50, height: 50, borderRadius: 25 },
  permiso: { alignItems: "center", gap: 16, paddingHorizontal: 30, paddingVertical: 30 },
  botonPermiso: { height: 46, paddingHorizontal: 22, borderRadius: 23, justifyContent: "center" },
});
