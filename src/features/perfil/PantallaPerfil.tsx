import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/features/auth/AuthProvider";
import { ProductCard } from "@/features/marketplace/components/ProductCard";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useUserProducts } from "@/features/marketplace/hooks/useUserProducts";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { averageRatingLabel } from "@/features/marketplace/rules";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useProductCardWidth } from "@/hooks/useProductCardWidth";
import { showComingSoonAlert, showErrorAlert } from "@/utils/alerts";
import { CirculosColor } from "./components/CirculosColor";
import { FilaAjuste } from "./components/FilaAjuste";
import { PerfilAvatar } from "./components/PerfilAvatar";
import { PerfilCabecera } from "./components/PerfilCabecera";
import { PerfilInformacion } from "./components/PerfilInformacion";
import { StickersFlotantes } from "./components/StickersFlotantes";
import { TarjetaAccion } from "./components/TarjetaAccion";
import { DrawerEditarPerfil } from "./drawer/DrawerEditarPerfil";
import { coloresTarjeta, estilosPerfil } from "./perfilEstilos";
import {
  IconoCampana,
  IconoCandado,
  IconoDocumento,
  IconoEditar,
  IconoFlecha,
  IconoLogin,
  IconoLuna,
  IconoMensaje,
  IconoPublicaciones,
  IconoSol,
} from "./Perfiliconos";
import { type ColorPerfil } from "./Perfiltemas";
import { useProfile } from "./ProfileProvider";

/** Color de acción de los switches (igual que el del drawer) */
const ACCION = "#101010";

// Todavía no hay seguidores: el número es fijo
const SEGUIDORES = "0";

/** Pantalla de perfil: header editable, estadísticas, publicaciones y ajustes */
export function PantallaPerfil() {
  const {
    styles: baseStyles,
    isDark,
    setIsDark,
    setThemeColor,
  } = useAppTheme();
  const { profile, saveProfile } = useProfile();
  const { uid } = useSessionUser();
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { products: mine, status: mineStatus } = useUserProducts(uid);
  const { openProduct, openUserProfile } = useAppNavigation();
  const { signOut } = useAuth();
  const cardWidth = useProductCardWidth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /* Cambia solo el color del perfil desde la fila de ajustes (sin abrir el drawer) */
  const handleColor = useCallback(
    (color: ColorPerfil) => {
      if (color === profile.color) return;
      setThemeColor(color);
      saveProfile({ ...profile, color }).catch((error) =>
        showErrorAlert("No se pudo cambiar el color", error),
      );
    },
    [profile, saveProfile, setThemeColor],
  );

  const abrirDrawer = useCallback(() => setDrawerOpen(true), []);
  const cerrarDrawer = useCallback(() => setDrawerOpen(false), []);

  const handleSignOut = useCallback(() => {
    signOut().catch((error) =>
      console.warn("No se pudo cerrar la sesión.", error),
    );
  }, [signOut]);

  const { fondoTarjeta, textoFila, flecha } = coloresTarjeta(isDark);
  const rowBg = isDark ? "#273449" : "#f5f5f5";
  const mutedColor = isDark ? "#94A3B8" : "#9CA3AF";
  const switchTrack = {
    false: isDark ? "#334155" : "#E5E7EB",
    true: isDark ? "#38BDF8" : ACCION,
  };

  return (
    <>
      <ScrollView
        style={baseStyles.screenScroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================ HEADER ============================ */}
        <PerfilCabecera
          color={profile.color}
          isDark={isDark}
          nav={<Text style={estilosPerfil.headerTitle}>Perfil</Text>}
          avatar={
            <PerfilAvatar
              photo={profile.photo}
              color={profile.color}
              name={profile.name}
              placeholder="icono"
            />
          }
        >
          {/* Stickers elegidos por el usuario (flotan suavemente) */}
          <StickersFlotantes stickers={profile.stickers} />
        </PerfilCabecera>

        {/* ======================= INFO DEL PERFIL ======================= */}
        <PerfilInformacion
          profile={profile}
          stats={{
            publicaciones: String(mine.length),
            seguidores: SEGUIDORES,
            reputacion: averageRatingLabel(mine),
          }}
          isDark={isDark}
        />

        <View style={{ paddingHorizontal: 15 }}>
          {mine.length ? (
            <View style={baseStyles.profilePostGrid}>
              {mine.map((product) => (
                <ProductCard
                  key={product.id}
                  item={product}
                  cardWidth={cardWidth}
                  favorite={favorites.includes(product.id)}
                  onOpen={openProduct}
                  onOpenSeller={openUserProfile}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </View>
          ) : mineStatus === "loading" ? (
            <LoadingState />
          ) : (
            <IllustratedEmptyState
              icon={
                <IconoPublicaciones
                  size={80}
                  color={isDark ? "#475569" : "#ffffffff"}
                />
              }
              title="Aún no tienes publicaciones"
              message="Lo que publiques aparecerá aquí automáticamente."
              style={{ paddingTop: 60, paddingBottom: 80 }}
            />
          )}

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
              onPress={abrirDrawer}
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

            {/* Color del perfil: paleta a la izquierda, círculos a la derecha, sin flecha */}
            <FilaAjuste
              bg={rowBg}
              icon={
                <Ionicons name="color-palette" size={23} color="#5d5d5d7d" />
              }
              iconWidth={26}
              label="Color"
              textColor={textoFila}
              right={
                <CirculosColor color={profile.color} onColor={handleColor} />
              }
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
            <FilaAjuste
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
            />
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
            icon={<IconoLogin size={25} color="#ff000090" />}
            label="Cerrar sesión"
            labelColor="#ff000092"
            backgroundColor={fondoTarjeta}
            arrowColor={flecha}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>

      <DrawerEditarPerfil
        visible={drawerOpen}
        initialData={profile}
        isDark={isDark}
        onClose={cerrarDrawer}
        onSave={saveProfile}
      />
    </>
  );
}

const styles = StyleSheet.create({
  //Tarjetas de General y legal
  settingsCard: {
    borderRadius: 19,
    padding: 15,
    marginTop: 21,
    gap: 8,
    elevation: 0.2,
  },
  cardLabel: { fontSize: 13.5, fontWeight: "500", marginBottom: 5 },
});
