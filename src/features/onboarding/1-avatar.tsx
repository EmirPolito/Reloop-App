import { StyleSheet, View } from "react-native";

import {
  SelectorAvatar,
  type FlujoAvatar,
} from "@/features/perfil/editar/SelectorAvatar";
import { BotonPaso } from "./components/BotonPaso";
import { SUBIR_CARRUSEL } from "./temaOnboarding";

/**
 * Paso 1: el avatar, con el mismo selector de Editar perfil (orbes, Tomar / Elegir). En su
 * vista inicial mide su alto: las demás páginas miden al menos eso, así la card no cambia de
 * tamaño entre pasos.
 */
export function PasoAvatar({
  flujo,
  photo,
  name,
  isDark,
  onContinuar,
  onMedir,
}: {
  /** El flujo vive en el drawer: también decide el título y a dónde vuelve la flecha */
  flujo: FlujoAvatar;
  photo: string | null;
  name: string;
  isDark: boolean;
  onContinuar: () => void;
  onMedir: (alto: number) => void;
}) {
  const enInicio = flujo.paso === "inicio";
  return (
    <View
      onLayout={(e) => {
        if (enInicio) onMedir(e.nativeEvent.layout.height);
      }}
    >
      <SelectorAvatar
        flujo={flujo}
        photo={photo}
        name={name}
        isDark={isDark}
        claveCarrusel="onboarding"
        mostrarConfirmar={false}
        subirCarrusel={SUBIR_CARRUSEL}
      />
      {enInicio ? (
        <View style={estilos.boton}>
          <BotonPaso
            texto={flujo.hayCambio ? "Usar este avatar" : "Continuar"}
            isDark={isDark}
            cargando={flujo.guardando}
            onPress={() =>
              flujo.hayCambio ? void flujo.usarAvatar() : onContinuar()
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  boton: { paddingHorizontal: 17, marginTop: 18 },
});
