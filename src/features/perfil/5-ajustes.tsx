import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { estiloTarjetaCristal } from "@/components/ui/cristalSuave";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import { universidadPorId } from "@/features/marketplace/universidades";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showComingSoonAlert } from "@/utils/alerts";
import { coloresTarjeta } from "./estilos";
import {
  IconoCandadoLinea,
  IconoCerrarSesionLinea,
  IconoDocumentoLinea,
  IconoFlecha,
  IconoLunaLinea,
  IconoMensajeLinea,
  IconoNotificacionLinea,
  IconoSolLinea,
} from "./iconosPerfil";
import { ConfirmarCerrarSesion } from "./components/ConfirmarCerrarSesion";
import { FilaAjuste, ListaAjustes } from "./components/FilaAjuste";
import { SheetUniversidad } from "./components/SheetUniversidad";
import { ToggleNotificaciones, ToggleTema } from "./components/TogglesAnimados";

/**
 * Ajustes al final del perfil propio: General y Más (términos, privacidad y cerrar sesión),
 * con las opciones separadas por una línea. Editar perfil está
 * en el botón de arriba a la derecha del perfil.
 */
export function AjustesPerfil({ isDark }: { isDark: boolean }) {
  const { signOut } = useAuth();
  const { setIsDark } = useAppTheme();
  const { openLegal } = useNavegacion();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [confirmando, setConfirmando] = useState(false);
  // Universidad de la que se ven las publicaciones en el inicio (se cambia en su drawer)
  const { universidad } = useMarketplaceState();
  const { setUniversidad } = useMarketplaceActions();
  const [eligiendoUniversidad, setEligiendoUniversidad] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const handleSignOut = useCallback(() => {
    setCerrando(true);
    signOut()
      .catch((error) => console.warn("No se pudo cerrar la sesión.", error))
      .finally(() => {
        setCerrando(false);
        setConfirmando(false);
      });
  }, [signOut]);

  const { textoFila, flecha } = coloresTarjeta(isDark);
  // Las tarjetas con el estilo de la de los chats (cristal, borde de luz y sombra suave)
  const tarjeta = estiloTarjetaCristal(isDark);
  // Las opciones sin fondo propio: el estilo de cristal es solo de la tarjeta
  const rowBg = "transparent";
  const mutedColor = isDark ? "#8b8b8bff" : "#9CA3AF";
  const colorIcono = isDark ? "#FFFFFF" : "#101010";

  return (
    <View style={styles.contenedor}>
      {/* ========================== GENERAL ========================== */}
      <View style={[styles.settingsCard, tarjeta]}>
        <ListaAjustes isDark={isDark}>
          <FilaAjuste
            bg={rowBg}
            icon={
              <IconoMensajeLinea size={22.5} color={colorIcono} grosor={1.5} />
            }
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
        </ListaAjustes>
      </View>

      {/* ==================== MÁS (legal y cerrar sesión) ==================== */}
      <View style={[styles.settingsCard, tarjeta]}>
        <ListaAjustes isDark={isDark}>
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
          <FilaAjuste
            bg={rowBg}
            icon={
              <Ionicons name="school-outline" size={23} color={colorIcono} />
            }
            label="Universidad"
            textColor={textoFila}
            onPress={() => setEligiendoUniversidad(true)}
            right={
              <View style={styles.derechaUniversidad}>
                <Text style={[styles.siglaUniversidad, { color: mutedColor }]}>
                  {universidadPorId(universidad).sigla}
                </Text>
                <IconoFlecha size={22} color={flecha} />
              </View>
            }
          />
          <FilaAjuste
            bg={rowBg}
            icon={<IconoCerrarSesionLinea size={25} color="#f20000ff" />}
            label="Cerrar sesión"
            textColor="#ff2424ff"
            onPress={() => setConfirmando(true)}
            right={<IconoFlecha size={22} color={flecha} />}
          />
        </ListaAjustes>
      </View>

      {/* Pie: versión, quién la desarrolla y el lema */}
      <View style={styles.pie}>
        <Text style={[styles.nota, { color: mutedColor }]}>
          Versión {VERSION}
        </Text>
        {/* Enlace a la página de qué es ReLoop, cómo empezó y por qué */}
        <PressableScale
          accessibilityRole="link"
          accessibilityLabel="Acerca de la app"
          onPress={() => openLegal("acerca")}
          scaleTo={0.96}
          hitSlop={10}
          style={styles.desarrollado}
        >
          <Text style={[styles.desarrolladoTexto, { color: textoFila }]}>
            Acerca de
          </Text>
          <Image
            accessibilityLabel="ReLoop"
            source={require("@/assets/images/logos-reloop/logoo.png")}
            contentFit="contain"
            // En oscuro el logo va en blanco para que se lea
            tintColor={isDark ? "#FFFFFF" : undefined}
            style={styles.logo}
          />
          {/* <Text style={[styles.desarrolladoTexto, { color: textoFila }]}>
            puedes
          </Text> */}
        </PressableScale>

        <Text style={[styles.nota, { color: mutedColor }]}>
          Dale una segunda vida a lo que ya no necesitas.
        </Text>
      </View>

      <SheetUniversidad
        visible={eligiendoUniversidad}
        universidad={universidad}
        isDark={isDark}
        onElegir={setUniversidad}
        onClose={() => setEligiendoUniversidad(false)}
      />

      <ConfirmarCerrarSesion
        visible={confirmando}
        cerrando={cerrando}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={handleSignOut}
      />
    </View>
  );
}

/** Versión de la app (la de app.json) */
const VERSION = Constants.expoConfig?.version ?? "1.0.0";

const styles = StyleSheet.create({
  contenedor: { paddingHorizontal: 16 },
  // Tarjetas de General y Más
  // Las filas se extienden más a los lados (padding 9); el título queda donde estaba (9 + 6)
  // Arriba y abajo lo justo para que se vea igual que el espacio entre opciones; sin relleno a
  // los lados, así la línea entre opciones llega de borde a borde
  settingsCard: {
    borderRadius: 21,
    paddingVertical: 1,
    paddingHorizontal: 0,
    marginTop: 22,
    gap: 10,
  },
  pie: { alignItems: "center", marginTop: 30, gap: 8 },
  // A la derecha de "Universidad": sus siglas y la flecha
  derechaUniversidad: { flexDirection: "row", alignItems: "center", gap: 4 },
  siglaUniversidad: { fontFamily: "Inter_400Regular", fontSize: 14 },
  // La versión y el lema con el mismo estilo
  nota: { fontFamily: "Inter_400Regular", fontSize: 13.1 },
  // El logo pegado al "por" (la imagen trae un poco de aire a la izquierda)
  desarrollado: { flexDirection: "row", alignItems: "center", gap: 0 },
  desarrolladoTexto: { fontFamily: "Inter_400Regular", fontSize: 14 },
  // Misma proporción que el logo del inicio (92 × 38)
  logo: { width: 46, height: 19, marginLeft: -1.45, marginRight: -1.45 },
});
