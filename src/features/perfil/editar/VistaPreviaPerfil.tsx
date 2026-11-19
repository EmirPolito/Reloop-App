import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { Text } from "@/features/shared/Text";
import { PerfilAvatar } from "../components/PerfilAvatar";
import {
  ALTO_PORTADA,
  BORDE_AVATAR,
  CapaPortada,
  SOLAPE_AVATAR,
} from "../components/PerfilDesplazable";
import { LADO_AVATAR, coloresTarjeta, fondoPerfil } from "../perfilEstilos";
import {
  DESCRIPCION_POR_DEFECTO,
  gradienteCieloPerfil,
  type DatosPerfil,
} from "../Perfiltemas";
import { PildoraPerfil } from "../Pildoraperfil";
import { conArroba } from "../username";

/**
 * Vista previa del perfil en tiempo real: la misma cabecera del perfil (portada, avatar,
 * etiquetas, nombre, @usuario, descripción y estadísticas), sin scroll. Recibe los datos
 * ya con los cambios en curso.
 */
export const VistaPreviaPerfil = memo(function VistaPreviaPerfil({
  profile,
  isDark,
  premium,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Membresía Premium vigente: muestra la insignia junto al nombre */
  premium: boolean;
}) {
  const insets = useSafeAreaInsets();
  const fondo = fondoPerfil(isDark);
  const { suave } = coloresTarjeta(isDark);
  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const ladoMarco = LADO_AVATAR + BORDE_AVATAR * 2;

  return (
    <View>
      <View style={{ height: insets.top + ALTO_PORTADA, overflow: "hidden" }}>
        <CapaPortada
          cover={profile.cover}
          cielo={gradienteCieloPerfil(profile.color, isDark)}
          insetTop={insets.top}
          onError={() => {}}
        />
      </View>

      <View
        style={[
          styles.filaAvatar,
          { marginTop: -SOLAPE_AVATAR - BORDE_AVATAR },
        ]}
      >
        <View
          style={{
            width: ladoMarco,
            height: ladoMarco,
            borderRadius: ladoMarco / 2,
            padding: BORDE_AVATAR,
            backgroundColor: fondo,
          }}
        >
          <View style={styles.avatar}>
            <PerfilAvatar
              photo={profile.photo}
              orb={profile.orb}
              color={profile.color}
              name={profile.name}
              placeholder="icono"
            />
          </View>
        </View>

        {profile.pills.length > 0 ? (
          <View style={styles.pildoras}>
            {profile.pills.map((pill) => (
              <PildoraPerfil
                key={pill.id}
                text={pill.text}
                color={pill.color}
                icon={pill.icon}
                isDark={isDark}
              />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <View style={styles.filaNombre}>
          <Text
            numberOfLines={2}
            style={[styles.nombre, { color: colorTexto }]}
          >
            {profile.name}
          </Text>
          {premium ? <PremiumBadge size={24} style={styles.insignia} /> : null}
        </View>
        {profile.username ? (
          <Text style={[styles.usuario, { color: suave }]}>
            {conArroba(profile.username)}
          </Text>
        ) : null}
        <Text style={[styles.descripcion, { color: colorTexto }]}>
          {profile.description.trim() || DESCRIPCION_POR_DEFECTO}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  filaAvatar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  avatar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    overflow: "hidden",
  },
  pildoras: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 9,
    marginLeft: 10,
    marginRight: -6,
    paddingBottom: 14,
    overflow: "hidden",
  },
  info: { paddingHorizontal: 16, gap: 4, paddingBottom: 4 },
  filaNombre: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  insignia: { marginTop: 1, marginLeft: -4 },
  nombre: {
    flexShrink: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 19,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 14.5, marginTop: -6.5 },
  descripcion: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    marginTop: 9,
  },
});
