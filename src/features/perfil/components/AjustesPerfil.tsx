import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useAuth } from "@/features/auth/AuthProvider";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showComingSoonAlert } from "@/utils/alerts";
import { coloresTarjeta } from "../perfilEstilos";
import {
  IconoCandadoLinea,
  IconoCerrarSesionLinea,
  IconoDocumentoLinea,
  IconoFlecha,
  IconoLunaLinea,
  IconoMensajeLinea,
  IconoNotificacionLinea,
  IconoSolLinea,
} from "../Perfiliconos";
import { FilaAjuste } from "./FilaAjuste";
import { TarjetaAccion } from "./TarjetaAccion";
import { ToggleNotificaciones, ToggleTema } from "./TogglesAnimados";

/**
 * Ajustes al final del perfil propio: General, Legal y Cerrar sesión. Editar perfil está
 * en el botón de arriba a la derecha del perfil.
 */
export function AjustesPerfil({ isDark }: { isDark: boolean }) {
  const { signOut } = useAuth();
  const { setIsDark } = useAppTheme();
  const { openLegal } = useAppNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = useCallback(() => {
    signOut().catch((error) =>
      console.warn("No se pudo cerrar la sesión.", error),
    );
  }, [signOut]);

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);
  const rowBg = isDark ? "#1b1b1b0e" : "#ffffffff";
  const mutedColor = isDark ? "#8b8b8bff" : "#9CA3AF";
  const colorIcono = isDark ? "#FFFFFF" : "#101010";

  return (
    <View style={styles.contenedor}>
      {/* ========================== GENERAL ========================== */}
      <View style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}>
        <Text style={[styles.cardLabel, { color: mutedColor }]}>General</Text>

        <FilaAjuste
          bg={rowBg}
          icon={<IconoMensajeLinea size={22.5} color={colorIcono} />}
          label="Cambiar correo"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Cambiar correo")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
        <FilaAjuste
          bg={rowBg}
          icon={<IconoCandadoLinea size={24.5} color={colorIcono} />}
          label="Cambiar contraseña"
          textColor={textoFila}
          onPress={() => showComingSoonAlert("Cambiar contraseña")}
          right={<IconoFlecha size={22} color={flecha} />}
        />

        <FilaAjuste
          bg={rowBg}
          icon={<IconoNotificacionLinea size={24} color={colorIcono} />}
          label="Notificaciones"
          textColor={textoFila}
          right={
            <ToggleNotificaciones
              accessibilityLabel="Activar o desactivar notificaciones"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              isDark={isDark}
            />
          }
        />
        {/* Modo claro / oscuro: se recuerda para la próxima vez que se abra la app */}
        <FilaAjuste
          bg={rowBg}
          icon={
            isDark ? (
              <IconoLunaLinea size={24} color={colorIcono} />
            ) : (
              <IconoSolLinea size={24} color={colorIcono} />
            )
          }
          label="Modo oscuro"
          textColor={textoFila}
          right={
            <ToggleTema
              accessibilityLabel="Activar o desactivar el modo oscuro"
              value={isDark}
              onValueChange={setIsDark}
            />
          }
        />
      </View>

      {/* =========================== LEGAL =========================== */}
      <View style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}>
        <Text style={[styles.cardLabel, { color: mutedColor }]}>Legal</Text>

        <FilaAjuste
          bg={rowBg}
          icon={<IconoDocumentoLinea size={24} color={colorIcono} />}
          label="Términos y condiciones"
          textColor={textoFila}
          onPress={() => openLegal("terminos")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
        <FilaAjuste
          bg={rowBg}
          icon={<IconoDocumentoLinea size={24} color={colorIcono} />}
          label="Política de privacidad"
          textColor={textoFila}
          onPress={() => openLegal("privacidad")}
          right={<IconoFlecha size={22} color={flecha} />}
        />
      </View>

      {/* ======================= CERRAR SESIÓN ======================= */}
      <TarjetaAccion
        icon={<IconoCerrarSesionLinea size={25} color="#f20000ff" />}
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
  contenedor: { paddingHorizontal: 16 },
  // Tarjetas de General y Legal
  // Las filas se extienden más a los lados (padding 9); el título queda donde estaba (9 + 6)
  settingsCard: {
    borderRadius: 21,
    paddingVertical: 15,
    paddingHorizontal: 4,
    marginTop: 22,
    gap: 10,
    elevation: 1,
  },
  cardLabel: {
    paddingHorizontal: 10,
    fontFamily: "Inter_400Regular",
    fontWeight: "500",
    marginBottom: 5,
  },
});
