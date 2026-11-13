import { useCallback, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { useAuth } from "@/features/auth/AuthProvider";
import { Text } from "@/features/shared/Text";
import { showComingSoonAlert } from "@/utils/alerts";
import { coloresTarjeta } from "../perfilEstilos";
import {
  IconoCampana,
  IconoCandado,
  IconoDocumento,
  IconoFlecha,
  IconoLogin,
  IconoMensaje,
} from "../Perfiliconos";
import { FilaAjuste } from "./FilaAjuste";
import { TarjetaAccion } from "./TarjetaAccion";

/** Color de acción de los switches (igual que el del drawer) */
const ACCION = "#101010";

/**
 * Ajustes al final del perfil propio: General, Legal y Cerrar sesión. Editar perfil está
 * en el botón de arriba a la derecha del perfil.
 */
export function AjustesPerfil({ isDark }: { isDark: boolean }) {
  const { signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = useCallback(() => {
    signOut().catch((error) =>
      console.warn("No se pudo cerrar la sesión.", error),
    );
  }, [signOut]);

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);
  const rowBg = isDark ? "#1b1b1b0e" : "#ffffffff";
  const mutedColor = isDark ? "#8b8b8bff" : "#9CA3AF";
  const switchTrack = {
    false: isDark ? "#828282ff" : "#E5E7EB",
    true: isDark ? "#ffffff0e" : ACCION,
  };

  return (
    <View style={styles.contenedor}>
      {/* ========================== GENERAL ========================== */}
      <View style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}>
        <Text style={[styles.cardLabel, { color: mutedColor }]}>General</Text>

        <FilaAjuste
          bg={rowBg}
          icon={<IconoMensaje size={22.5} color="#101010" />}
          label="Cambiar correo"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Cambiar correo")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
        <FilaAjuste
          bg={rowBg}
          icon={<IconoCandado size={23} color="#101010" />}
          label="Cambiar contraseña"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Cambiar contraseña")}
          right={<IconoFlecha size={22} color={flecha} />}
        />

        <FilaAjuste
          bg={rowBg}
          icon={
            <IconoCampana
              size={24}
              color="#101010"
              secondaryColor="#909090ff"
            />
          }
          label="Notificaciones"
          textColor={textoFila}
          right={
            <Switch
              accessibilityLabel="Activar o desactivar notificaciones"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={switchTrack}
              ios_backgroundColor={switchTrack.false}
              thumbColor="#FFFFFF"
            />
          }
        />
        {/* <FilaAjuste
          bg={rowBg}
          icon={
            isDark ? (
              <IconoLuna size={24} color="#c3c3c3aa" />
            ) : (
              <IconoSol size={24} color="#f59e0baa" />
            )
          }
          label="Modo claro"
          textColor={textoFila}
          right={
            <Switch
              accessibilityLabel="Activar o desactivar el modo oscuro"
              value={isDark}
              onValueChange={setIsDark}
              trackColor={switchTrack}
              ios_backgroundColor={switchTrack.false}
              thumbColor="#FFFFFF"
            />
          }
        /> */}
      </View>

      {/* =========================== LEGAL =========================== */}
      <View style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}>
        <Text style={[styles.cardLabel, { color: mutedColor }]}>Legal</Text>

        <FilaAjuste
          bg={rowBg}
          icon={
            <IconoDocumento size={24.5} color="#101010" lineColor="#909090ff" />
          }
          label="Términos y condiciones"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Términos y condiciones")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
        <FilaAjuste
          bg={rowBg}
          icon={
            <IconoDocumento size={24.5} color="#101010" lineColor="#909090ff" />
          }
          label="Términos y condiciones"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Términos y condiciones")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
      </View>

      {/* ======================= CERRAR SESIÓN ======================= */}
      <TarjetaAccion
        icon={<IconoLogin size={25} color="#f20000ff" />}
        label="Cerrar sesión"
        labelColor="#ff2424ff"
        backgroundColor={fondoTarjeta}
        arrowColor={flecha}
        onPress={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingHorizontal: 15 },
  // Tarjetas de General y Legal
  // Las filas se extienden más a los lados (padding 9); el título queda donde estaba (9 + 6)
  settingsCard: {
    borderRadius: 19,
    paddingVertical: 15,
    paddingHorizontal: 9,
    marginTop: 21,
    gap: 8,
    elevation: 0.4,
  },
  cardLabel: {
    paddingHorizontal: 6,
    fontFamily: "Inter_400Regular",
    fontWeight: "500",
    marginBottom: 5,
  },
});
