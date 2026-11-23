import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  memo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

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
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { formatNotificationTime } from "@/features/notificaciones/reglasNotificaciones";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import {
  IconoEditar,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoPuntosVertical,
} from "../iconosPerfil";
import { COLORES_DESTACADO, type DatosPerfil } from "../temasPerfil";
import { reportUser } from "../repositorioPerfil";

/** Ancho de cada foto respecto al ancho de la tarjeta */
const PROPORCION_FOTO = 0.29;
const SEPARACION_FOTOS = 18;
/**
 * Corazón de favorito sobre cada foto, con el mismo efecto que en las publicaciones sueltas:
 * da un brinco rápido (crece y vuelve, sin rebotar)
 */
function CorazonFoto({
  favorito,
  nombre,
  onPress,
}: {
  favorito: boolean;
  nombre: string;
  onPress: () => void;
}) {
  const escala = useSharedValue(1);
  const estiloCorazon = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        favorito
          ? `Quitar ${nombre} de favoritos`
          : `Agregar ${nombre} a favoritos`
      }
      accessibilityState={{ selected: favorito }}
      hitSlop={6}
      onPress={() => {
        escala.set(
          withSequence(
            withTiming(1.3, { duration: 90 }),
            withTiming(1, { duration: 110 }),
          ),
        );
        onPress();
      }}
      style={styles.corazonFoto}
    >
      <Animated.View style={estiloCorazon}>
        {favorito ? (
          <IconoCorazonRelleno size={19} color={COLOR_FAVORITO} />
        ) : (
          <IconoCorazon size={19} color="#FFFFFF" />
        )}
      </Animated.View>
    </Pressable>
  );
}
const COLOR_FAVORITO = "#F2143C";
const ALTO_PILDORA_FRANJA = 22;

/** Colores de la tarjeta según el tema */
export function coloresTarjetaVendedor(isDark: boolean) {
  const fondo = isDark ? "#1A1C20" : "#FFFFFF";
  const texto = isDark ? "claro" : "oscuro";
  const principal = texto === "claro" ? "#FFFFFF" : "#101010";

  return {
    fondo,
    principal,
    suave: texto === "claro" ? "rgba(255,255,255,0.7)" : "rgba(16,16,16,0.55)",
  };
}

/** Mensaje predeterminado de la franja */
export const NOTA_POR_DEFECTO = "Escríbeme por chat si algo te interesa";

/** Solo el primer nombre */
export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] || nombre;
}

/** Marco con la franja inferior */
export function MarcoFranja({
  diseno,
  isDark,
  children,
}: {
  diseno: DatosPerfil["tarjeta"];
  isDark: boolean;
  children: ReactNode;
}) {
  const c = coloresTarjetaVendedor(isDark);
  const claro = c.principal === "#FFFFFF";

  const pildora = diseno.colorDestacado
    ? COLORES_DESTACADO[diseno.colorDestacado]
    : {
        fondo: c.principal,
        texto: claro ? "#101010" : "#FFFFFF",
      };

  return (
    <View
      style={[
        styles.marco,
        {
          backgroundColor: isDark ? "#30343B" : "#dfdfdfff",
        },
      ]}
    >
      {children}

      <View style={styles.franja}>
        {diseno.destacado ? (
          <View style={[styles.destacado, { backgroundColor: pildora.fondo }]}>
            <Text
              numberOfLines={1}
              style={[styles.destacadoTexto, { color: pildora.texto }]}
            >
              {diseno.destacado}
            </Text>
          </View>
        ) : null}

        <Text
          numberOfLines={2}
          style={[
            styles.notaTexto,
            {
              color: diseno.colorNota
                ? COLORES_DESTACADO[diseno.colorNota].suelto
                : c.principal,
            },
          ]}
        >
          {diseno.nota ?? NOTA_POR_DEFECTO}
        </Text>
      </View>
    </View>
  );
}

/** Formato de la fecha de última publicación */
function textoHora(ultima: number, ahora: number): string {
  const corto = formatNotificationTime(ultima, ahora);

  if (corto === "ahora") return "Publicó ahora";

  return /^\d+ (min|h|d)$/.test(corto)
    ? `Hace ${corto}`
    : `Publicó el ${corto}`;
}

/**
 * Tarjeta de publicaciones de un vendedor.
 */
export const TarjetaVendedor = memo(function TarjetaVendedor({
  items,
  profile,
  ownerId,
  isOwn,
  isDark,
  onOpen,
  onPersonalizar,
  enPerfil = false,
}: {
  items: Product[];
  profile: DatosPerfil;
  ownerId: string;
  isOwn: boolean;
  isDark: boolean;
  onOpen: (productId: string) => void;
  onPersonalizar: () => void;
  enPerfil?: boolean;
}) {
  const { uid } = useSessionUser();
  const { openUserProfile } = useNavegacion();
  const premium = useIsPremium(ownerId);

  const { favorites } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();

  // El ancho se calcula desde el primer dibujo con el de la pantalla (menos los márgenes de la
  // lista), así las fotos salen junto con lo demás y no después; al medir se corrige si cambia
  const { width: anchoPantalla } = useWindowDimensions();
  const [ancho, setAncho] = useState(() => Math.min(anchoPantalla, 760) - 32);
  const [menu, setMenu] = useState(false);
  const [ahora] = useState(() => Date.now());

  // Las fotos no se arrastran con el dedo (temblaban al deslizar dentro de la lista): se
  // avanzan con las flechas, de una en una
  const fotosRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [indice, setIndice] = useState(0);

  const c = coloresTarjetaVendedor(isDark);

  const ultima = Math.max(0, ...items.map((item) => item.createdAt));

  const interior = Math.max(ancho - 24, 0);
  const lado = Math.round(interior * PROPORCION_FOTO);
  // Cuántas caben completas a la vista y hasta dónde se puede avanzar
  const visibles = Math.max(
    Math.floor((interior + SEPARACION_FOTOS) / (lado + SEPARACION_FOTOS)),
    1,
  );
  const ultimo = Math.max(items.length - visibles, 0);
  const irAFoto = (destino: number) => {
    const siguiente = Math.min(Math.max(destino, 0), ultimo);
    setIndice(siguiente);
    fotosRef.current?.scrollTo({
      x: siguiente * (lado + SEPARACION_FOTOS),
      animated: true,
    });
  };

  const reportar = () => {
    showAlert("Reportar usuario", `¿Quieres reportar a ${profile.name}?`, [
      {
        text: "Cancelar",
        style: "cancel",
      },
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
    <MarcoFranja diseno={profile.tarjeta} isDark={isDark}>
      <View
        onLayout={(e) => {
          const nuevoAncho = Math.round(e.nativeEvent.layout.width);
          if (nuevoAncho !== ancho) {
            setAncho(nuevoAncho);
          }
        }}
        style={[styles.tarjeta, { backgroundColor: c.fondo }]}
      >
        {/* Encabezado */}
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

          {enPerfil ? (
            isOwn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar el diseño de la tarjeta"
                hitSlop={8}
                onPress={onPersonalizar}
                style={styles.lapiz}
              >
                <IconoEditar size={22} color={c.principal} />
              </Pressable>
            ) : null
          ) : (
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
                <IconoPuntosVertical size={22} color={c.principal} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Carrusel horizontal de imágenes */}
        {lado > 0 ? (
          <View style={styles.fotos}>
            <ScrollView
              ref={fotosRef}
              horizontal
              // Sin arrastre: solo se mueve con las flechas
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fotosContenido}
            >
              {items.map((item) => {
                const precio = formatProductPrice(item);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.foto,
                      {
                        width: lado,
                        height: lado,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Ver ${item.name}`}
                      unstable_pressDelay={80}
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
                          cachePolicy="memory-disk"
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

                    {/* En las propias no va el corazón */}
                    {isOwn ? null : (
                      <CorazonFoto
                        favorito={favorites.includes(item.id)}
                        nombre={item.name}
                        onPress={() => toggleFavorite(item.id)}
                      />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Pie de tarjeta */}
        <View style={styles.pie}>
          <Text
            numberOfLines={1}
            style={[styles.titulo, { color: c.principal }]}
          >
            Mira lo que ofrece {primerNombre(profile.name)}
          </Text>

          {/* Flechas para recorrer las fotos (no se arrastran): una foto por toque; la que ya
              no puede ir más lejos se apaga */}
          {ultimo > 0 ? (
            <View style={styles.flechas}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Publicaciones anteriores"
                accessibilityState={{ disabled: indice === 0 }}
                disabled={indice === 0}
                hitSlop={8}
                onPress={() => irAFoto(indice - 1)}
                style={({ pressed }) => [
                  styles.flecha,
                  indice === 0 && styles.flechaApagada,
                  pressed && styles.flechaPresionada,
                ]}
              >
                <IconoFlechaIzquierda size={26} color={c.principal} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Más publicaciones"
                accessibilityState={{ disabled: indice >= ultimo }}
                disabled={indice >= ultimo}
                hitSlop={8}
                onPress={() => irAFoto(indice + 1)}
                style={({ pressed }) => [
                  styles.flecha,
                  indice >= ultimo && styles.flechaApagada,
                  pressed && styles.flechaPresionada,
                ]}
              >
                <IconoFlechaDerecha size={26} color={c.principal} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Menú de opciones */}
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
                {
                  backgroundColor: isDark ? "#262626" : "#FFFFFF",
                },
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
                    {
                      color: isDark ? "#F1F5F9" : "#101010",
                    },
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
    </MarcoFranja>
  );
});

const styles = StyleSheet.create({
  // Tarjeta
  tarjeta: {
    borderRadius: 26,
    padding: 12,
    paddingBottom: 8,
    overflow: "hidden",
  },

  // Encabezado
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  datos: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  nombre: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },

  hora: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },

  derecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  calificacion: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },

  puntos: {
    marginLeft: 8,
    padding: 2,
  },

  lapiz: {
    padding: 2,
    marginRight: 8,
  },

  // Carrusel
  fotos: {
    marginTop: 24,
    marginHorizontal: -12,
  },

  fotosContenido: {
    paddingHorizontal: 12,
    gap: SEPARACION_FOTOS,
  },

  // Corazón de favorito sobre cada foto (abajo a la derecha)
  corazonFoto: {
    position: "absolute",
    right: 7,
    bottom: 7,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  // Flechas del pie: solo el icono, sin fondo
  flechas: { flexDirection: "row", alignItems: "center", gap: 6 },
  flecha: { padding: 4 },
  flechaApagada: { opacity: 0.3 },
  flechaPresionada: { opacity: 0.55, transform: [{ scale: 0.92 }] },

  foto: {
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "rgba(120,120,128,0.2)",
  },

  // Precio
  precio: {
    position: "absolute",
    top: 7,
    left: 7,
    maxWidth: "80%",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  precioTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11.5,
    color: "#FFFFFF",
  },

  // Pie
  pie: {
    marginTop: 14,
    minHeight: 34,
    paddingHorizontal: 5,
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

  // Marco
  marco: {
    borderRadius: 30,
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
  },

  franja: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: ALTO_PILDORA_FRANJA + 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  destacado: {
    flexShrink: 0,
    maxWidth: "50%",
    height: ALTO_PILDORA_FRANJA,
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 9,
  },

  destacadoTexto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },

  notaTexto: {
    flexShrink: 1,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 13.5,
  },

  // Menú
  cierreMenu: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },

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

  opcionTexto: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
});
