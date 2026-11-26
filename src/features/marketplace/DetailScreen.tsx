import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { conSalida } from "@/components/salidaModulo";
import { BackHeader } from "@/components/ui/BackHeader";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { useAbrirChat } from "@/features/chats/hooks/useAbrirChat";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { AZUL_PEDIR, coloresPedido } from "@/features/pedidos/colores";
import { ListaProductos } from "@/features/pedidos/components/ListaProductos";
import { ResumenPedido } from "@/features/pedidos/components/ResumenPedido";
import { SheetPago } from "@/features/pedidos/components/SheetPago";
import {
  MAX_POR_ITEM,
  formatearDinero,
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
import { categoryFor } from "./data";
import { useProduct } from "./hooks/useProductsByIds";
import { useReportProduct } from "./hooks/useReportProduct";
import { useToggleFavorite } from "./hooks/useToggleFavorite";
import { useMarketplaceState } from "./MarketplaceProvider";
import { allowsProductRating, formatProductPrice } from "./rules";
import type { Product, ProductOption } from "./types";

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
    },
  ];
}

export function DetailScreen({ productId }: { productId: string }) {
  const insets = useSafeAreaInsets();
  const { styles: tema, isDark } = useAppTheme();
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
  // El chat del pedido recién mandado: se abre al terminar la ola
  const chatPedido = useRef<string | null>(null);
  const volver = () => conSalida(back);

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
        {/* Volver a la izquierda; reportar a la derecha */}
        <View style={styles.barra}>
          <BotonBarra
            etiqueta="Volver"
            onPress={volver}
            fondo={isDark ? undefined : "#FFFFFF"}
          >
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={28} color={c.texto} />
            </View>
          </BotonBarra>
          {product.isMine ? null : (
            <BotonBarra
              etiqueta={
                isReported ? "Publicación reportada" : "Reportar publicación"
              }
              onPress={() => reportProduct(product)}
              disabled={isReported}
              fondo={isDark ? undefined : "#FFFFFF"}
            >
              <Ionicons
                name={isReported ? "flag" : "flag-outline"}
                size={20}
                color="#D14343"
              />
            </BotonBarra>
          )}
        </View>

        <GaleriaPublicacion
          imagenes={product.images}
          categoria={product.category}
          favorito={favorite}
          onFavorito={() => toggleFavorite(product.id)}
        />

        <View style={styles.info}>
          {/* El precio a la derecha, a la altura del título: si el título es largo baja de
              línea en su columna y el precio no se mueve */}
          <View style={styles.filaTitulo}>
            <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
              {product.name}
            </Text>
            {price ? (
              <Text
                style={[INTER.semibold, styles.precio, { color: c.texto }]}
              >
                {price}
              </Text>
            ) : null}
          </View>
          {/* Debajo del título, las estrellas y la ubicación; la categoría a la derecha */}
          <View style={styles.filaDetalles}>
            <View style={styles.detalles}>
              {conPedido ? (
                <View style={styles.calificacion}>
                  <Text
                    style={[
                      INTER.semibold,
                      styles.calificacionTexto,
                      { color: c.texto },
                    ]}
                  >
                    {(product.rating ?? 0).toFixed(1)}
                  </Text>
                  <Ionicons name="star" size={16} color="#FFC107" />
                </View>
              ) : null}
              {product.ubicacion ? (
                <View style={styles.ubicacion}>
                  <Ionicons name="location-outline" size={16} color={c.suave} />
                  <Text
                    numberOfLines={1}
                    style={[
                      INTER.medium,
                      styles.ubicacionTexto,
                      { color: c.suave },
                    ]}
                  >
                    {product.ubicacion}
                  </Text>
                </View>
              ) : null}
            </View>
            {/* La categoría en píldora, como en el inicio pero más chica */}
            <View style={[styles.pildora, { backgroundColor: c.neutro }]}>
              <Text
                style={[INTER.medium, styles.categoria, { color: c.texto }]}
              >
                {category.label}
              </Text>
            </View>
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
                    {items.length === 0
                      ? "Siguiente"
                      : `Siguiente · ${formatearDinero(total)}`}
                  </Text>
                </PressableScale>
              </>
            )}
            <TarjetaResenas resenas={resenas} promedio={product.rating} />
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
  contenido: { paddingHorizontal: 18, gap: 20 },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -4,
  },
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
  filaDetalles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  detalles: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minWidth: 0,
  },
  calificacion: { flexDirection: "row", alignItems: "center", gap: 4 },
  calificacionTexto: { fontSize: 15.5 },
  ubicacion: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ubicacionTexto: { flexShrink: 1, fontSize: 14.5 },
  pildora: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
  },
  categoria: { fontSize: 12.5 },
  bloque: { gap: 6 },
  subtitulo: { fontSize: 16 },
  descripcion: { fontSize: 14.5, lineHeight: 22 },
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
