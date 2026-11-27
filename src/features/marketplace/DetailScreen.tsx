import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { conSalida } from "@/components/salidaModulo";
import { BackHeader } from "@/components/ui/BackHeader";
import { LADO_BOTON_BARRA } from "@/components/ui/BotonBarra";
import { EmptyState } from "@/components/ui/EmptyState";
import { EASE_OUT_CUBIC } from "@/constants/motion";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { useAbrirChat } from "@/features/chats/hooks/useAbrirChat";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { AZUL_PEDIR, coloresPedido } from "@/features/pedidos/colores";
import { ListaProductos } from "@/features/pedidos/components/ListaProductos";
import { ResumenPedido } from "@/features/pedidos/components/ResumenPedido";
import { SheetPago } from "@/features/pedidos/components/SheetPago";
import {
  MAX_POR_ITEM,
  type ItemPedido,
} from "@/features/pedidos/formatoPedido";
import { useMandarPedido } from "@/features/pedidos/useMandarPedido";
import { INTER } from "@/features/perfil/editar/editarTema";
import { TarjetaResenas } from "@/features/resenas/components/TarjetaResenas";
import { useResenas } from "@/features/resenas/repositorioResenas";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { EsqueletoDetalle } from "./components/EsqueletoDetalle";
import { GaleriaPublicacion } from "./components/GaleriaPublicacion";
import {
  IconoCategoriaDetalle,
  IconoEstrellaDetalle,
  IconoUbicacionDetalle,
} from "./components/IconosDetalle";
import { categoryFor } from "./data";
import { useProduct } from "./hooks/useProductsByIds";
import { useReportProduct } from "./hooks/useReportProduct";
import { useToggleFavorite } from "./hooks/useToggleFavorite";
import { useMarketplaceState } from "./MarketplaceProvider";
import { allowsProductRating, formatProductPrice } from "./rules";
import type { Product, ProductOption } from "./types";

/** Aire a los lados del contenido */
const MARGEN_LADOS = 18;
/** La foto de arriba: aire con las orillas de la pantalla (a los lados y arriba) */
const ORILLA = 8;
/** Alto de la foto respecto a su ancho (un poco más larga hacia abajo) */
const PROPORCION_PORTADA = 0.92;

const TRANSICION_SUAVE = LinearTransition.duration(260).easing(EASE_OUT_CUBIC);

/** Sin productos guardados, la publicación misma es lo único que se pide */
function opcionesDe(producto: Product): ProductOption[] {
  if (producto.options.length > 0) return producto.options;
  return [
    {
      id: "principal",
      name: producto.name,
      description: "",
      price: producto.price,
      imageUri: producto.imageUri,
      available: producto.availableQuantity,
    },
  ];
}

export function DetailScreen({ productId }: { productId: string }) {
  const insets = useSafeAreaInsets();
  const { width: anchoPantalla } = useWindowDimensions();
  const { styles: tema, isDark } = useAppTheme();
  // La hora y los iconos de arriba en blanco: van sobre la foto (y su velo oscuro)
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle(isDark ? "light" : "dark");
    }, [isDark]),
  );
  const c = coloresPedido(isDark);
  const { favorites, reported } = useMarketplaceState();
  const toggleFavorite = useToggleFavorite();
  const { back, openThread } = useNavegacion();
  const openChat = useAbrirChat();
  const reportProduct = useReportProduct();
  const { product, loading } = useProduct(productId);
  const conPedido = product ? allowsProductRating(product.category) : false;
  const resenas = useResenas(productId, conPedido);
  const { mandar, enviando } = useMandarPedido();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [pagando, setPagando] = useState(false);
  const [resenasAbiertas, setResenasAbiertas] = useState(false);
  // El chat del pedido recién mandado: se abre al terminar la ola
  const chatPedido = useRef<string | null>(null);
  const volver = () => conSalida(back);

  const flechaResenas = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(resenasAbiertas ? "180deg" : "0deg", {
          duration: 260,
          easing: EASE_OUT_CUBIC,
        }),
      },
    ],
  }));

  if (!product) {
    // Mientras se lee: la forma del detalle (no una ruedita bajo un encabezado)
    if (loading) return <EsqueletoDetalle onBack={volver} />;
    return (
      <View style={tema.fill}>
        <BackHeader title="Publicación" onBack={volver} />
        <EmptyState
          title="No encontramos este producto"
          message="Vuelve al inicio y revisa otras publicaciones."
          icon="search"
        />
      </View>
    );
  }

  const category = categoryFor(product.category);
  const favorite = favorites.includes(product.id);
  const isReported = reported.includes(product.id);
  const price = formatProductPrice(product);
  const seller = { id: product.ownerId, name: product.seller };
  const opciones = opcionesDe(product);
  // Sin productos aparte, lo que se puede pedir es lo que hay disponible
  const maximo =
    product.options.length > 0 ? MAX_POR_ITEM : product.availableQuantity;
  const items: ItemPedido[] = opciones.flatMap((opcion) => {
    const cantidad = cantidades[opcion.id] ?? 0;
    return cantidad > 0
      ? [{ nombre: opcion.name, precio: opcion.price, cantidad }]
      : [];
  });
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const totalResenas = product.reviewCount ?? resenas.length;

  async function enviarPedido(
    metodo: "efectivo" | "transferencia",
    nota: string,
  ) {
    if (!product) return false;
    chatPedido.current = await mandar(product, items, metodo, nota);
    return chatPedido.current !== null;
  }

  // Al terminar la ola baja el drawer; ya abajo, se abre el chat (navegar con el drawer a
  // medio cierre lo dejaba atorado encima de la conversación)
  function alTerminarOla() {
    setPagando(false);
    setCantidades({});
  }

  function alCerrarPago() {
    const chatId = chatPedido.current;
    chatPedido.current = null;
    if (chatId) conSalida(() => openThread(chatId));
  }

  return (
    <View style={tema.fill}>
      <ScrollView
        style={tema.fill}
        contentContainerStyle={[
          styles.contenido,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom + 24, 28),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* La foto casi de orilla a orilla y desde arriba (detrás de la hora), con un poco de
            aire a los lados y arriba y las cuatro esquinas redondas; encima, volver, el título y
            reportar en blanco (solo iconos), sobre un velo oscuro para que se lean */}
        <View
          style={[
            styles.portada,
            {
              marginTop: -(insets.top + 8) + ORILLA,
              marginHorizontal: -(MARGEN_LADOS - ORILLA),
            },
          ]}
        >
          <GaleriaPublicacion
            imagenes={product.images}
            categoria={product.category}
            favorito={favorite}
            onFavorito={() => toggleFavorite(product.id)}
            estilo={{
              aspectRatio: undefined,
              height: Math.round(
                (anchoPantalla - ORILLA * 2) * PROPORCION_PORTADA +
                  insets.top / 2,
              ),
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0.26)", "rgba(0,0,0,0)"]}
            style={[styles.veloArriba, { height: insets.top + 80 }]}
          />
          <View
            style={[
              styles.barra,
              // Un poco más arriba
              { top: insets.top - ORILLA - 6, left: 10, right: 10 },
            ]}
          >
            {/* Centrado en toda la barra (no entre los botones): queda al medio aunque no
                haya botón de reportar */}
            <View pointerEvents="none" style={styles.tituloBarra}>
              <Text
                accessibilityRole="header"
                style={[INTER.semibold, styles.tituloBarraTexto]}
              >
                Pedir
              </Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={volver}
              scaleTo={0.88}
              hitSlop={8}
              style={styles.botonIcono}
            >
              <BackArrowIcon size={28} color="#FFFFFF" />
            </PressableScale>
            {product.isMine ? null : (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={
                  isReported ? "Publicación reportada" : "Reportar publicación"
                }
                accessibilityState={{ disabled: isReported }}
                disabled={isReported}
                onPress={() => reportProduct(product)}
                scaleTo={0.88}
                hitSlop={8}
                style={styles.botonIcono}
              >
                {/* Relleno, para que se vea sobre la foto; ya reportada se ve apagado */}
                <Ionicons
                  name="flag"
                  size={22}
                  color="#FFFFFF"
                  style={isReported ? styles.reportado : null}
                />
              </PressableScale>
            )}
          </View>
        </View>

        <View style={styles.info}>
          {/* El precio a la derecha, a la altura del título: si el título es largo baja de
              línea en su columna y el precio no se mueve */}
          <View style={styles.filaTitulo}>
            <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
              {product.name}
            </Text>
            {price ? (
              <Text style={[INTER.semibold, styles.precio, { color: c.texto }]}>
                {price}
              </Text>
            ) : null}
          </View>
          {/* Debajo del título: estrellas a la izquierda, categoría al centro y ubicación a la
              derecha, cada una con su icono de color */}
          <View style={styles.filaDetalles}>
            {[
              conPedido ? (
                <>
                  <IconoEstrellaDetalle size={18} color="#FFB800" />
                  <Text
                    style={[
                      INTER.regular,
                      styles.detalleTexto,
                      { color: c.texto },
                    ]}
                  >
                    {(product.rating ?? 0).toFixed(1)}
                  </Text>
                </>
              ) : null,
              <>
                <IconoCategoriaDetalle size={18} color="#101010" />
                <Text
                  numberOfLines={1}
                  style={[
                    INTER.regular,
                    styles.detalleTexto,
                    { color: c.texto },
                  ]}
                >
                  {category.label}
                </Text>
              </>,
              product.ubicacion ? (
                <>
                  {/* Más pegado a su texto que los demás iconos */}
                  <View style={styles.iconoPegado}>
                    <IconoUbicacionDetalle size={18} color="#FF4D67" />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      INTER.regular,
                      styles.detalleTexto,
                      { color: c.texto },
                    ]}
                  >
                    {product.ubicacion}
                  </Text>
                </>
              ) : null,
            ]
              .filter((detalle) => detalle !== null)
              .map((detalle, i, todos) => (
                <View
                  key={i}
                  style={[
                    styles.detalle,
                    {
                      // El primero a la izquierda, el último a la derecha y, si son tres, el
                      // de en medio al centro
                      justifyContent:
                        i === 0
                          ? "flex-start"
                          : i === todos.length - 1
                            ? "flex-end"
                            : "center",
                    },
                  ]}
                >
                  {detalle}
                </View>
              ))}
          </View>
        </View>

        <View style={styles.bloque}>
          <Text style={[INTER.semibold, styles.subtitulo, { color: c.texto }]}>
            Descripción
          </Text>
          <Text style={[INTER.regular, styles.descripcion, { color: c.suave }]}>
            {product.description}
          </Text>
        </View>

        {conPedido ? (
          <>
            {product.isMine ? null : (
              <>
                <ListaProductos
                  opciones={opciones}
                  cantidades={cantidades}
                  maximo={maximo}
                  onCambiar={(id, cantidad) =>
                    setCantidades((actual) => ({ ...actual, [id]: cantidad }))
                  }
                />
                <ResumenPedido items={items} />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityState={{ disabled: items.length === 0 }}
                  disabled={items.length === 0}
                  onPress={() => setPagando(true)}
                  scaleTo={0.97}
                  style={[
                    styles.botonAzul,
                    styles.ancho,
                    { opacity: items.length === 0 ? 0.45 : 1 },
                  ]}
                >
                  <Text style={[INTER.semibold, styles.botonAzulTexto]}>
                    Siguiente
                  </Text>
                </PressableScale>
              </>
            )}

            <Animated.View
              layout={TRANSICION_SUAVE}
              style={styles.pestanaContenedor}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  resenasAbiertas ? "Ocultar reseñas" : "Ver reseñas"
                }
                accessibilityState={{ expanded: resenasAbiertas }}
                onPress={() => setResenasAbiertas((valor) => !valor)}
                style={styles.pestanaFila}
              >
                <Text
                  style={[
                    INTER.semibold,
                    styles.pestanaTitulo,
                    { color: c.texto },
                  ]}
                >
                  Reseñas{totalResenas > 0 ? ` (${totalResenas})` : ""}
                </Text>
                <Animated.View style={flechaResenas}>
                  <Ionicons name="chevron-down" size={18} color={c.texto} />
                </Animated.View>
              </Pressable>

              {resenasAbiertas ? (
                <Animated.View
                  entering={FadeIn.duration(240).easing(EASE_OUT_CUBIC)}
                  exiting={FadeOut.duration(160).easing(EASE_OUT_CUBIC)}
                  style={styles.pestanaContenido}
                >
                  <TarjetaResenas
                    resenas={resenas}
                    promedio={product.rating}
                    total={product.reviewCount}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          </>
        ) : product.isMine ? null : (
          // Donaciones, intercambios y adopciones: chat y pedir, del mismo tamaño
          <View style={styles.botones}>
            <PressableScale
              accessibilityRole="button"
              onPress={() => openChat(seller)}
              scaleTo={0.97}
              style={[styles.boton, { backgroundColor: c.neutro }]}
            >
              <Text
                style={[INTER.semibold, styles.botonTexto, { color: c.texto }]}
              >
                Chat
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              onPress={() => openChat(seller, product)}
              scaleTo={0.97}
              style={[styles.boton, styles.botonAzul]}
            >
              <Text style={[INTER.semibold, styles.botonAzulTexto]}>Pedir</Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>

      {conPedido ? (
        <SheetPago
          visible={pagando}
          isDark={isDark}
          total={total}
          enviando={enviando}
          onClose={() => setPagando(false)}
          onEnviar={enviarPedido}
          onEnviado={alTerminarOla}
          onCerrado={alCerrarPago}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Más cerca de la imagen de arriba
  contenido: { paddingHorizontal: MARGEN_LADOS, gap: 14 },
  // Encima de la foto, a la altura de la hora
  barra: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  veloArriba: { position: "absolute", top: 0, left: 0, right: 0 },
  // Recorta la foto y su velo con las mismas esquinas
  portada: { borderRadius: 30, overflow: "hidden" },
  // Solo el icono, sin fondo: del mismo tamaño que los botones de siempre para tocarlo fácil
  botonIcono: {
    width: LADO_BOTON_BARRA,
    height: LADO_BOTON_BARRA,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloBarra: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloBarraTexto: { fontSize: 20, color: "#FFFFFF" },
  info: { gap: 6 },
  filaTitulo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titulo: { flex: 1, fontSize: 22, lineHeight: 28 },
  // Con el mismo alto de línea que el título: queda centrado con su primera línea
  precio: { fontSize: 17, lineHeight: 28, flexShrink: 0 },
  // Un poco más abajo del título
  filaDetalles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  // Cada detalle ocupa lo mismo: así quedan a la izquierda, al centro y a la derecha
  detalle: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  iconoPegado: { marginRight: -3 },
  reportado: { opacity: 0.5 },
  detalleTexto: { flexShrink: 1, fontSize: 13.5 },
  // La descripción, un poco más abajo de los detalles
  bloque: { gap: 6, marginTop: 10 },
  subtitulo: { fontSize: 16 },
  descripcion: { fontSize: 14.5, lineHeight: 22 },
  pestanaContenedor: { overflow: "hidden", marginTop: 4 },
  pestanaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  pestanaTitulo: { fontSize: 16 },
  pestanaContenido: { paddingTop: 4, paddingBottom: 8 },
  botones: { flexDirection: "row", gap: 12, marginTop: 4 },
  boton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontSize: 15.5 },
  botonAzul: {
    backgroundColor: AZUL_PEDIR,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ancho: { width: "100%" },
  botonAzulTexto: { color: "#FFFFFF", fontSize: 15.5 },
});
