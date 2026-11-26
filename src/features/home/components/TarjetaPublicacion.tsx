import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import {
  allowsProductRating,
  formatProductPrice,
  formatPublicationTime,
} from "@/features/marketplace/rules";
import type { Product } from "@/features/marketplace/types";
import { coloresTarjetaVendedor } from "@/features/perfil/components/TarjetaVendedor";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { Text } from "@/features/shared/Text";
import { useMinutoActual } from "@/hooks/useMinutoActual";
import { optimizedImageUrl } from "@/lib/imageUrl";
import {
  IconoCorazon,
  IconoCorazonRelleno,
  IconoEstrella,
} from "./IconosTarjeta";

const COLOR_FAVORITO = "#F2143C";
const COLOR_ESTRELLA = "#F5A623";
const RADIO = 22;
/** Borde blanco de la tarjeta */
const BORDE = 3;

/**
 * Tarjeta de publicación: encabezado del vendedor, foto cuadrada y pie con nombre,
 * precio y puntuación. En tarjetas angostas reduce tipografía y controles.
 */
export const TarjetaPublicacion = memo(function TarjetaPublicacion({
  item,
  cardWidth,
  favorite,
  onOpen,
  onOpenSeller,
  onToggleFavorite,
  acciones,
  sinEncabezado = false,
  alto,
}: {
  item: Product;
  cardWidth: number;
  favorite: boolean;
  onOpen: (productId: string) => void;
  /** Recibe el uid de quien vende */
  onOpenSeller: (ownerId: string) => void;
  onToggleFavorite: (productId: string) => void;
  /** Si se pasa, va en lugar del avatar, el título y el precio (el perfil propio) */
  acciones?: ReactNode;
  /** Sin la fila de arriba (avatar, nombre y hora): en el perfil de esa persona ya se sabe quién es */
  sinEncabezado?: boolean;
  /** Alto fijo de la tarjeta (el perfil las quiere todas del mismo alto, también la vacía) */
  alto?: number;
}) {
  const { isDark } = useAppTheme();
  // Cada minuto: así "Hace 5 min" se mantiene al día
  const ahora = useMinutoActual();
  const perfil = usePerfilDe(item.ownerId);
  const imageUri = optimizedImageUrl(item.imageUri, cardWidth * 2);
  const conEstrella = allowsProductRating(item.category);
  const calificacion = (item.rating ?? 0).toFixed(1);
  const mostrarPrecioYRanking =
    item.category !== "cambio" &&
    item.category !== "donacion" &&
    item.category !== "mascota";
  const precio = formatProductPrice(item);
  const nombreUsuario = perfil?.name ?? item.seller;
  const compacta = cardWidth < 260;
  const ladoAvatar = compacta ? 32 : 44;
  const radioCorazon = compacta ? 20 : 25;
  // La foto no llega a los lados: deja este aire y tiene sus propias esquinas redondeadas
  const margenFoto = compacta ? 6 : 8;
  const ladoFoto = Math.round(cardWidth - BORDE * 2 - margenFoto * 2);

  const colorTexto = isDark ? "#F1F5F9" : "#101010";

  // El corazón da un brinco rápido: crece y vuelve, sin rebotar
  const escala = useSharedValue(1);
  const estiloCorazon = useAnimatedStyle(() => ({
    transform: [{ scale: escala.get() }],
  }));
  const alternarFavorito = () => {
    escala.set(
      withSequence(
        withTiming(1.3, { duration: 90 }),
        withTiming(1, { duration: 110 }),
      ),
    );
    onToggleFavorite(item.id);
  };

  return (
    // Capa externa: la sombra (si recortara, iOS la cortaría); la interna recorta la foto
    <View
      style={[
        estilos.sombra,
        {
          width: cardWidth,
          ...(alto ? { height: alto } : {}),
          // Gris muy claro (neutral-50) con borde blanco; en oscuro, el mismo fondo neutro de
          // la tarjeta grande (el de antes se veía azul) y el borde apenas se ve
          backgroundColor: isDark
            ? coloresTarjetaVendedor(true).fondo
            : "#FAFAFA",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
        },
      ]}
    >
      <View style={estilos.tarjeta}>
        {sinEncabezado ? null : (
          <View
            style={[
              estilos.encabezado,
              // Un poco menos de aire arriba del avatar (el de abajo se queda igual)
              { height: compacta ? 50 : 60, paddingBottom: 4 },
              compacta && estilos.encabezadoCompacto,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${nombreUsuario}`}
              onPress={() => onOpenSeller(item.ownerId)}
              hitSlop={6}
            >
              <AvatarVendedor
                ownerId={item.ownerId}
                fallbackName={nombreUsuario}
                size={ladoAvatar}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.name}`}
              onPress={() => onOpen(item.id)}
              style={estilos.usuario}
            >
              <Text
                numberOfLines={1}
                style={[
                  compacta
                    ? estilos.nombreUsuarioCompacto
                    : estilos.nombreUsuario,
                  { color: colorTexto },
                ]}
              >
                {nombreUsuario}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  compacta ? estilos.tiempoCompacto : estilos.tiempo,
                  // En oscuro, un gris un poco más claro: el de serie casi no se leía
                  isDark && { color: "#8A8D93" },
                ]}
              >
                {formatPublicationTime(item.createdAt, ahora)}
                {item.ubicacion ? ` · ${item.ubicacion}` : ""}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? "Quitar de favoritos" : "Agregar a favoritos"
              }
              accessibilityState={{ selected: favorite }}
              onPress={alternarFavorito}
              hitSlop={10}
              style={estilos.favorito}
            >
              <Animated.View style={estiloCorazon}>
                {favorite ? (
                  <IconoCorazonRelleno
                    size={radioCorazon}
                    color={COLOR_FAVORITO}
                  />
                ) : (
                  <IconoCorazon
                    size={radioCorazon}
                    color={isDark ? "#F1F5F9" : "#101010"}
                  />
                )}
              </Animated.View>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${item.name}`}
          onPress={() => onOpen(item.id)}
          style={{
            marginHorizontal: margenFoto,
            // Sin encabezado la foto va arriba: el mismo aire que a los lados
            marginTop: sinEncabezado ? margenFoto : 0,
          }}
        >
          <LinearGradient
            colors={PRODUCT_COLORS[item.category]}
            style={[
              estilos.foto,
              {
                height: ladoFoto,
                borderRadius: RADIO - BORDE - margenFoto / 2 + 4,
              },
            ]}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <AppIcon
                name={PRODUCT_ICONS[item.category]}
                size={34}
                color="#FFFFFF"
              />
            )}
          </LinearGradient>
        </Pressable>

        {sinEncabezado && !acciones ? (
          // Sin encabezado, el favorito va sobre la foto
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? "Quitar de favoritos" : "Agregar a favoritos"
            }
            accessibilityState={{ selected: favorite }}
            onPress={alternarFavorito}
            hitSlop={8}
            style={[
              estilos.favoritoSobreFoto,
              { top: 8 + margenFoto, right: 8 + margenFoto },
            ]}
          >
            <Animated.View style={estiloCorazon}>
              {favorite ? (
                <IconoCorazonRelleno size={20} color={COLOR_FAVORITO} />
              ) : (
                <IconoCorazon size={20} color="#FFFFFF" />
              )}
            </Animated.View>
          </Pressable>
        ) : null}

        {acciones ? (
          <View style={estilos.acciones}>{acciones}</View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.name}`}
            onPress={() => onOpen(item.id)}
            style={[estilos.pie, compacta && estilos.pieCompacto]}
          >
            <Text
              numberOfLines={1}
              style={[
                compacta ? estilos.tituloCompacto : estilos.titulo,
                { color: colorTexto },
              ]}
            >
              {item.name}
            </Text>
            {mostrarPrecioYRanking ? (
              <View style={estilos.pieInferior}>
                {precio ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      compacta ? estilos.precioCompacto : estilos.precio,
                      { color: colorTexto },
                    ]}
                  >
                    {precio}
                  </Text>
                ) : (
                  <View />
                )}
                {conEstrella ? (
                  <View
                    accessible
                    accessibilityLabel={`Calificación ${calificacion}`}
                    style={estilos.calificacion}
                  >
                    <IconoEstrella
                      size={compacta ? 16 : 21}
                      color={COLOR_ESTRELLA}
                    />
                    <Text
                      style={[
                        compacta ? estilos.notaCompacta : estilos.nota,
                        { color: colorTexto },
                      ]}
                    >
                      {calificacion}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              // Sin precio ni calificación: el mismo espacio, así la tarjeta no queda más chica
              <View style={estilos.pieInferior} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  sombra: {
    borderRadius: RADIO,
    borderWidth: BORDE,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  tarjeta: { borderRadius: RADIO - BORDE, overflow: "hidden" },
  encabezado: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  encabezadoCompacto: {
    paddingHorizontal: 5,
  },
  usuario: { flex: 1, minWidth: 0, marginLeft: 6 },
  nombreUsuario: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  nombreUsuarioCompacto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  tiempo: {
    marginTop: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#6B7280",
  },
  tiempoCompacto: {
    marginTop: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#6B7280",
  },
  favorito: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  favoritoSobreFoto: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  foto: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  pie: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  pieCompacto: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 5 },
  pieInferior: {
    minHeight: 22,
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  calificacion: { flexDirection: "row", alignItems: "center", gap: 3 },
  nota: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  notaCompacta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  titulo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  tituloCompacto: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
  },
  // Mismo tipo y tamaño que el número de la calificación
  precio: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  precioCompacto: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  acciones: { paddingHorizontal: 12, paddingBottom: 10 },
});
