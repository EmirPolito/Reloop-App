import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  IconoCorazon,
  IconoCorazonRelleno,
  IconoEstrella,
} from "@/features/home/components/IconosTarjeta";
import { useToggleFavorite } from "@/features/marketplace/hooks/useToggleFavorite";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import {
  averageRatingLabel,
  formatProductPrice,
} from "@/features/marketplace/rules";
import type { Product } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { formatNotificationTime } from "@/features/notificaciones/notificationRules";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { useVendedoresFavoritos } from "@/features/favoritos/vendedoresFavoritos";
import { FONDOS_TARJETA, type DatosPerfil } from "../Perfiltemas";
import { reportUser } from "../profileRepository";

/** Ancho de cada foto respecto al ancho de la tarjeta (se ven dos y un pedazo de la tercera) */
const PROPORCION_FOTO = 0.32;
const SEPARACION_FOTOS = 12;
const COLOR_FAVORITO = "#F2143C";

/** Colores resueltos de la tarjeta: lo que eligió la persona o, si no, lo que pide el tema */
export function coloresTarjetaVendedor(
  diseno: DatosPerfil["tarjeta"],
  isDark: boolean,
) {
  const fondo = diseno.fondo ?? (isDark ? "#1B2230" : "#FFFFFF");
  const conocido = FONDOS_TARJETA.find((f) => f.color === diseno.fondo);
  const texto =
    diseno.texto ??
    conocido?.texto ??
    (diseno.fondo ? "oscuro" : isDark ? "claro" : "oscuro");
  const principal = texto === "claro" ? "#FFFFFF" : "#101010";
  return {
    fondo,
    principal,
    suave: texto === "claro" ? "rgba(255,255,255,0.7)" : "rgba(16,16,16,0.55)",
    // Botones redondos (corazón, puntos): un velo del color contrario al texto
    boton: texto === "claro" ? "rgba(255,255,255,0.16)" : "rgba(16,16,16,0.08)",
  };
}

/** Solo el primer nombre: "Emir Demo" → "Emir" */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] || nombre;
}

/**
 * Imagen de fondo de la tarjeta: desenfocada y cubierta por un velo del color de fondo, así
 * suaviza los colores de la foto y el texto se lee siempre (no se ve la foto "a pelo").
 */
export function FondoImagenTarjeta({
  uri,
  color,
}: {
  uri: string;
  color: string;
}) {
  return (
    <>
      <Image
        source={{ uri }}
        contentFit="cover"
        blurRadius={10}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, opacity: 0.6 },
        ]}
      />
    </>
  );
}

/** "Hace 3 h", "Hace 2 d" o la fecha de la publicación más reciente */
function textoHora(ultima: number, ahora: number): string {
  const corto = formatNotificationTime(ultima, ahora);
  if (corto === "ahora") return "Publicó ahora";
  return /^\d+ (min|h|d)$/.test(corto)
    ? `Hace ${corto}`
    : `Publicó el ${corto}`;
}

/**
 * Publicaciones de una persona (3 o más) en una sola tarjeta: arriba su avatar y nombre con la
 * hora de su última publicación, la calificación y el menú de tres puntos (reportar, o
 * personalizar si es la propia); en medio, las fotos con desplazamiento lateral (tocar una
 * abre la publicación); abajo "Post de este usuario" y el corazón (seguir).
 */
export const TarjetaVendedor = memo(function TarjetaVendedor({
  items,
  profile,
  ownerId,
  isOwn,
  isDark,
  onOpen,
  onPersonalizar,
}: {
  items: Product[];
  profile: DatosPerfil;
  ownerId: string;
  isOwn: boolean;
  isDark: boolean;
  onOpen: (productId: string) => void;
  /** Abre el diseño de la tarjeta (solo en la propia) */
  onPersonalizar: () => void;
}) {
  const { uid } = useSessionUser();
  const { openUserProfile } = useAppNavigation();
  const premium = useIsPremium(ownerId);
  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { ids: vendedoresFavoritos, alternar } = useVendedoresFavoritos();
  const guardada = vendedoresFavoritos.includes(ownerId);
  const [ancho, setAncho] = useState(0);
  const [menu, setMenu] = useState(false);
  // Un solo "ahora" por dibujo de la tarjeta: la hora no cambia entre renders
  const [ahora] = useState(() => Date.now());

  const c = coloresTarjetaVendedor(profile.tarjeta, isDark);
  const ultima = Math.max(0, ...items.map((item) => item.createdAt));
  const interior = Math.max(ancho - 24, 0);
  const lado = Math.round(interior * PROPORCION_FOTO);

  const reportar = () => {
    showAlert("Reportar usuario", `¿Quieres reportar a ${profile.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Reportar",
        style: "destructive",
        onPress: () => {
          reportUser(uid, ownerId).then(
            () =>
              showAlert(
                "Reporte enviado",
                "Gracias por ayudar a mantener segura la comunidad.",
              ),
            (error) => showErrorAlert("No se pudo enviar el reporte", error),
          );
        },
      },
    ]);
  };

  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={[styles.tarjeta, { backgroundColor: c.fondo }]}
    >
      {profile.tarjeta.imagen ? (
        <FondoImagenTarjeta
          uri={
            optimizedImageUrl(profile.tarjeta.imagen, 900) ??
            profile.tarjeta.imagen
          }
          color={c.fondo}
        />
      ) : null}

      {/* Avatar, nombre y hora a la izquierda; calificación y menú a la derecha */}
      <View style={styles.encabezado}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver perfil de ${profile.name}`}
          hitSlop={6}
          onPress={() => openUserProfile(ownerId)}
        >
          <UserAvatar
            photo={profile.photo}
            orb={profile.orb}
            name={profile.name}
            size={38}
            premium={premium}
          />
        </Pressable>
        <View style={styles.datos}>
          <Text
            numberOfLines={1}
            style={[styles.nombre, { color: c.principal }]}
          >
            {profile.name}
          </Text>
          <Text numberOfLines={1} style={[styles.hora, { color: c.suave }]}>
            {textoHora(ultima, ahora)}
          </Text>
        </View>
        <View style={styles.derecha}>
          <IconoEstrella size={16} color={c.principal} />
          <Text style={[styles.calificacion, { color: c.principal }]}>
            {averageRatingLabel(items)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más opciones"
            hitSlop={8}
            onPress={() => setMenu((abierto) => !abierto)}
            style={styles.puntos}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={c.principal}
            />
          </Pressable>
        </View>
      </View>

      {/* Fotos: se desplazan a los lados y se detienen en cada una */}
      {lado > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={lado + SEPARACION_FOTOS}
          decelerationRate="fast"
          style={styles.fotos}
          contentContainerStyle={styles.fotosContenido}
        >
          {items.map((item) => {
            const precio = formatProductPrice(item);
            const favorito = favorites.includes(item.id);
            return (
              <View
                key={item.id}
                style={[styles.foto, { width: lado, height: lado }]}
              >
                {/* Tocar la foto abre la publicación; el corazón va aparte (no se anidan botones) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${item.name}`}
                  onPress={() => onOpen(item.id)}
                  style={StyleSheet.absoluteFill}
                >
                  {item.imageUri ? (
                    <Image
                      source={{
                        uri:
                          optimizedImageUrl(item.imageUri, lado * 2) ??
                          item.imageUri,
                      }}
                      contentFit="cover"
                      transition={150}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                </Pressable>
                {precio ? (
                  <View pointerEvents="none" style={styles.precio}>
                    <Text numberOfLines={1} style={styles.precioTexto}>
                      {precio}
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    favorito ? "Quitar de favoritos" : "Guardar en favoritos"
                  }
                  hitSlop={6}
                  onPress={() => toggleFavorite(item.id)}
                  style={styles.corazonFoto}
                >
                  {favorito ? (
                    <IconoCorazonRelleno size={24} color={COLOR_FAVORITO} />
                  ) : (
                    <IconoCorazon size={24} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.pie}>
        <Text style={[styles.titulo, { color: c.principal }]}>
          Post de {primerNombre(profile.name)}
        </Text>
        <PressableSuave
          accessibilityRole="button"
          accessibilityLabel={
            isOwn
              ? "Tu tarjeta"
              : guardada
                ? "Quitar esta tarjeta de favoritos"
                : "Guardar esta tarjeta en favoritos"
          }
          accessibilityState={{ selected: guardada }}
          disabled={isOwn}
          onPress={() => alternar(ownerId)}
          style={[styles.botonCorazon, { backgroundColor: c.boton }]}
        >
          {guardada ? (
            <IconoCorazonRelleno size={21} color={COLOR_FAVORITO} />
          ) : (
            <IconoCorazon size={21} color={c.principal} />
          )}
        </PressableSuave>
      </View>

      {/* Menú de tres puntos: tocar fuera de él lo cierra */}
      {menu ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
            onPress={() => setMenu(false)}
            style={styles.cierreMenu}
          />
          <View
            style={[
              styles.menu,
              { backgroundColor: isDark ? "#262626" : "#FFFFFF" },
            ]}
          >
            <PressableSuave
              accessibilityRole="button"
              accessibilityLabel={isOwn ? "Personalizar tarjeta" : "Reportar"}
              onPress={() => {
                setMenu(false);
                if (isOwn) onPersonalizar();
                else reportar();
              }}
              style={styles.opcionMenu}
            >
              <Text
                style={[
                  styles.opcionTexto,
                  { color: isDark ? "#F1F5F9" : "#101010" },
                ]}
              >
                {isOwn ? "Personalizar tarjeta" : "Reportar"}
              </Text>
              <Ionicons
                name={isOwn ? "color-palette-outline" : "flag-outline"}
                size={20}
                color={isDark ? "#F1F5F9" : "#101010"}
              />
            </PressableSuave>
          </View>
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  // Tarjeta
  tarjeta: {
    borderRadius: 26,
    padding: 12,
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
  },
  // Fila de arriba
  encabezado: { flexDirection: "row", alignItems: "center", gap: 10 },
  // Nombre y hora
  datos: { flex: 1, minWidth: 0, gap: 2 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  hora: { fontFamily: "Inter_500Medium", fontSize: 12 },
  // Calificación y tres puntos, juntos a la derecha
  derecha: { flexDirection: "row", alignItems: "center", gap: 5 },
  calificacion: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  puntos: { marginLeft: 8, padding: 2 },
  // Fotos con desplazamiento lateral
  fotos: { marginTop: 10, marginHorizontal: -12 },
  fotosContenido: { paddingHorizontal: 12, gap: SEPARACION_FOTOS },
  foto: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(120,120,128,0.2)",
  },
  // Etiqueta del precio sobre la foto
  precio: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "80%",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  precioTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  // Corazón de favorito sobre la foto
  corazonFoto: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  // Pie: "Post de este usuario" y el corazón
  pie: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  titulo: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  botonCorazon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  // Menú de tres puntos: velo que lo cierra y la tarjetita de opciones
  cierreMenu: { ...StyleSheet.absoluteFill, zIndex: 5 },
  menu: {
    position: "absolute",
    top: 56,
    right: 14,
    zIndex: 6,
    minWidth: 190,
    borderRadius: 16,
    paddingHorizontal: 6,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.18)",
  },
  opcionMenu: {
    height: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  opcionTexto: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
