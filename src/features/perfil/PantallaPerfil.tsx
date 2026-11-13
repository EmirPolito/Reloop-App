import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ESPACIO_SUPERIOR_PERFIL,
  coloresTarjeta,
  fondoPerfil,
} from "@/features/perfil/perfilEstilos";

import { useAuth } from "@/features/auth/AuthProvider";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showComingSoonAlert } from "@/utils/alerts";
import { FilaAjuste } from "./components/FilaAjuste";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { PerfilCabecera } from "./components/PerfilCabecera";
import { PerfilInformacion } from "./components/PerfilInformacion";
import {
  PublicacionesPerfil,
  SIN_ANUNCIOS,
} from "./components/PublicacionesPerfil";
import { TarjetaAccion } from "./components/TarjetaAccion";
import { useFollowers } from "./hooks/useFollowers";
import {
  IconoCampana,
  IconoCandado,
  IconoDocumento,
  IconoEditar,
  IconoFlecha,
  IconoLogin,
  IconoMensaje,
} from "./Perfiliconos";
import { useProfile } from "./ProfileProvider";

/** Color de acción de los switches (igual que el del drawer) */
const ACCION = "#101010";

/** Pantalla de perfil: header editable, estadísticas, publicaciones y ajustes */
export function PantallaPerfil() {
  const { styles: baseStyles, isDark, setIsDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { uid } = useSessionUser();
  const { products: mine, status: mineStatus } = useUserProducts(uid);
  const { followersCount } = useFollowers(uid);
  const { openProduct, openEditProfile } = useAppNavigation();
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
    <View style={{ flex: 1, backgroundColor: fondoPerfil(isDark) }}>
      <ScrollView
        style={baseStyles.screenScroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sin portada por ahora: avatar, nombre, etiquetas, descripción y estadísticas */}
        <View style={{ height: insets.top + ESPACIO_SUPERIOR_PERFIL }} />

        <PerfilCabecera
          isDark={isDark}
          avatar={
            <PerfilAvatar
              photo={profile.photo}
              orb={profile.orb}
              color={profile.color}
              name={profile.name}
              placeholder="icono"
            />
          }
        />

        {/* ======================= INFO DEL PERFIL ======================= */}
        <PerfilInformacion
          profile={profile}
          stats={{
            publicaciones: String(mine.length),
            seguidores: String(followersCount),
            reputacion: averageRatingLabel(mine),
          }}
          isDark={isDark}
        />

        <View style={{ paddingHorizontal: 15 }}>
          {/* Publicaciones y anuncios, en pestañas */}
          <PublicacionesPerfil
            publicaciones={mine}
            anuncios={SIN_ANUNCIOS}
            status={mineStatus}
            isOwn
            isDark={isDark}
            onOpen={openProduct}
          />

          {/* ========================== GENERAL ========================== */}
          <View
            style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}
          >
            <Text style={[styles.cardLabel, { color: mutedColor }]}>
              General
            </Text>

            <FilaAjuste
              bg={rowBg}
              icon={<IconoEditar size={23} color="#5d5d5d7d" />}
              label="Editar perfil"
              textColor={textoFila}
              onPress={openEditProfile}
              right={<IconoFlecha size={22} color={flecha} />}
            />
            <FilaAjuste
              bg={rowBg}
              icon={<IconoMensaje size={23} color="#5d5d5d7d" />}
              label="Cambiar correo"
              textColor={textoFila}
              onPress={() => showComingSoonAlert("Cambiar correo")}
              right={<IconoFlecha size={22} color={flecha} />}
            />
            <FilaAjuste
              bg={rowBg}
              icon={<IconoCandado size={23} color="#5d5d5d7d" />}
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
                  color="#5d5d5d7d"
                  secondaryColor="#757575ff"
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
          <View
            style={[styles.settingsCard, { backgroundColor: fondoTarjeta }]}
          >
            <Text style={[styles.cardLabel, { color: mutedColor }]}>Legal</Text>

            <FilaAjuste
              bg={rowBg}
              icon={<IconoDocumento size={24.5} color="#7676767d" />}
              label="Términos y condiciones"
              textColor={textoFila}
              onPress={() => showComingSoonAlert("Términos y condiciones")}
              right={<IconoFlecha size={22} color={flecha} />}
            />
            <FilaAjuste
              bg={rowBg}
              icon={<IconoDocumento size={24.5} color="#7676767d" />}
              label="Política de privacidad"
              textColor={textoFila}
              onPress={() => showComingSoonAlert("Política de privacidad")}
              right={<IconoFlecha size={22} color={flecha} />}
            />
          </View>

          {/* ======================= CERRAR SESIÓN ======================= */}
          <TarjetaAccion
            icon={<IconoLogin size={25} color="#ff0202ff" />}
            label="Cerrar sesión"
            labelColor="#ff2424ff"
            backgroundColor={fondoTarjeta}
            arrowColor={flecha}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
