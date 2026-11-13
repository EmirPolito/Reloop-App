import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { TecladoSheetCtx } from "@/features/perfil/drawer/InputSheet";
import { SeccionEtiquetas } from "@/features/perfil/drawer/SeccionEtiquetas";
import { CampoDescripcion } from "@/features/perfil/editar/CampoDescripcion";
import { CampoEnLinea } from "@/features/perfil/editar/CampoEnLinea";
import { CampoUsername } from "@/features/perfil/editar/CampoUsername";
import { coloresEditar, INTER } from "@/features/perfil/editar/editarTema";
import { accionesBorradorEtiquetas } from "@/features/perfil/editar/SheetEtiquetas";
import {
  DESCRIPCION_POR_DEFECTO,
  MAX_DESCRIPCION,
  MAX_NOMBRE,
  type DatosPerfil,
  type PildoraPerfilData,
} from "@/features/perfil/Perfiltemas";
import { Text } from "@/features/shared/Text";
import { BotonPaso } from "../components/BotonPaso";
import { puedeFinalizar } from "../onboardingRules";

/**
 * Paso 3: nombre, @username, descripción y etiquetas, con los mismos campos, límites y
 * validaciones de Editar perfil. Nombre, usuario y descripción se guardan al confirmarlos
 * (como allí); las etiquetas, al finalizar.
 */
export function PasoIdentidad({
  profile,
  isDark,
  onGuardar,
  onFinalizar,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Guarda cambios del perfil; si falla lanza (y ya avisó) */
  onGuardar: (cambios: Partial<DatosPerfil>) => Promise<void>;
  /** Guarda las etiquetas y marca el onboarding como completo */
  onFinalizar: (pills: PildoraPerfilData[]) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const [borrador, setBorrador] = useState(profile.pills);
  const [finalizando, setFinalizando] = useState(false);
  const { agregar, cambiarColor, cambiarIcono, quitar } =
    accionesBorradorEtiquetas(setBorrador);
  const listo = puedeFinalizar(profile.username);

  const finalizar = async () => {
    if (finalizando || !listo) return;
    setFinalizando(true);
    try {
      await onFinalizar(
        borrador
          .map((x) => ({ ...x, text: x.text.trim() }))
          .filter((x) => x.text.length > 0),
      );
    } catch {
      // Ya se avisó; se queda en el paso para reintentar
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <TecladoSheetCtx.Provider value={teclado}>
      <View style={styles.paso}>
        {/* Vista previa de cómo te verán */}
        <View style={styles.vista}>
          <UserAvatar
            photo={profile.photo}
            orb={profile.orb}
            name={profile.name}
            size={64}
          />
          <View style={styles.campos}>
            <CampoEnLinea
              value={profile.name}
              placeholder="Tu nombre"
              maxLength={MAX_NOMBRE}
              requerido
              textStyle={{
                ...INTER.semibold,
                fontSize: 20,
                letterSpacing: -0.5,
                color: c.texto,
              }}
              iconColor={c.suave}
              accessibilityLabel="nombre"
              onSave={(name) => onGuardar({ name })}
            />
            <CampoUsername username={profile.username} isDark={isDark} />
          </View>
        </View>

        <CampoDescripcion
          value={profile.description}
          placeholder={DESCRIPCION_POR_DEFECTO}
          maxLength={MAX_DESCRIPCION}
          textStyle={{
            ...INTER.regular,
            fontSize: 13.5,
            lineHeight: 19,
            color: c.texto,
          }}
          borde={isDark ? "#334155" : "#DEDEE3"}
          placeholderColor={c.suave}
          onSave={(description) => onGuardar({ description })}
        />

        <View style={styles.etiquetas}>
          <Text style={[INTER.medium, { fontSize: 13, color: c.suave }]}>
            Intereses
          </Text>
          <SeccionEtiquetas
            pills={borrador}
            modo={isDark ? "oscuro" : "claro"}
            onAdd={agregar}
            onColor={cambiarColor}
            onIcon={cambiarIcono}
            onRemove={quitar}
          />
        </View>

        <BotonPaso
          texto={listo ? "Finalizar" : "Asignando tu usuario…"}
          isDark={isDark}
          cargando={finalizando}
          deshabilitado={!listo}
          onPress={() => void finalizar()}
        />
      </View>
    </TecladoSheetCtx.Provider>
  );
}

const styles = StyleSheet.create({
  paso: { paddingHorizontal: 17, gap: 16, paddingTop: 4 },
  vista: { flexDirection: "row", alignItems: "center", gap: 14 },
  campos: { flex: 1, minWidth: 0, gap: 6, alignItems: "flex-start" },
  etiquetas: { gap: 8 },
});
