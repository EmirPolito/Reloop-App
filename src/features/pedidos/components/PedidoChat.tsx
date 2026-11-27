import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { PressableScale } from "@/components/PressableScale";
import { useProduct } from "@/features/marketplace/hooks/useProductsByIds";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { coloresPedido } from "../colores";
import { formatearDinero, nombreMetodo, type Pedido } from "../formatoPedido";
import { MonedaIcon, TarjetaPagoIcon } from "./IconosPago";

const ANCHO = 278;
const ANCHO_IMPRESORA = ANCHO - 12;
const ANCHO_PAPEL = ANCHO - 22;

function LineaPunteada({ color }: { color: string }) {
  return (
    <View style={styles.punteada}>
      <View style={[styles.punteadaBorde, { borderColor: color }]} />
    </View>
  );
}

/** Borde inferior ondulado tipo ticket recortado */
function BordeOndulado({ ancho, fill }: { ancho: number; fill: string }) {
  const ondas = 11;
  const paso = ancho / ondas;
  const alto = 10;

  let d = `M 0 0 L ${ancho} 0 L ${ancho} 2.5 `;
  for (let i = ondas; i > 0; i--) {
    const x2 = (i - 1) * paso;
    const xm = x2 + paso / 2;
    d += `Q ${xm} ${alto}, ${x2} 2.5 `;
  }
  d += "Z";

  return (
    <Svg width={ancho} height={alto} style={styles.onduladoSvg}>
      <Path d={d} fill={fill} />
    </Svg>
  );
}

export function PedidoChat({
  pedido,
  hora,
  mia,
}: {
  pedido: Pedido;
  hora: string;
  mia: boolean;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const efectivo = pedido.metodo === "efectivo";
  const { product } = useProduct(pedido.productoId);
  const { openProduct } = useNavegacion();

  const tieneNota = Boolean(pedido.nota?.trim());
  const colorPapel = isDark ? "#1E1E22" : "#FFFFFF";
  const colorMuesca = isDark ? "#0D0D0F" : "#f4f4f4ff";

  return (
    <View
      style={[
        styles.contenedor,
        { alignSelf: mia ? "flex-end" : "flex-start" },
      ]}
    >
      {/* 1. CABEZAL: Negro en modo claro, blanco en modo oscuro */}
      <View
        style={[
          styles.impresora,
          isDark
            ? {
                backgroundColor: "#FFFFFF",
                borderColor: "#E5E7EB",
                shadowOpacity: 0.1,
              }
            : {
                backgroundColor: "#141416",
                borderColor: "#27272A",
                shadowOpacity: 0.14,
              },
        ]}
      >
        <View style={styles.impresoraTop}>
          <View style={styles.impresoraIzq}>
            <Ionicons
              name="receipt-outline"
              size={14}
              color={isDark ? "#71717A" : "#A1A1AA"}
            />
            <Text
              style={[
                INTER.semibold,
                styles.impresoraTitulo,
                { color: isDark ? "#111827" : "#F4F4F5" },
              ]}
            >
              Pedido
            </Text>
          </View>

          <View
            style={[
              styles.impresoraMetodo,
              isDark
                ? { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" }
                : { backgroundColor: "#36363E", borderColor: "#464650" },
            ]}
          >
            {efectivo ? (
              <MonedaIcon size={15} />
            ) : (
              <TarjetaPagoIcon size={14} />
            )}
            <Text
              style={[
                INTER.medium,
                styles.impresoraMetodoTexto,
                { color: isDark ? "#111827" : "#F4F4F5" },
              ]}
            >
              {nombreMetodo(pedido.metodo)}
            </Text>
          </View>
        </View>

        {/* Ranura por donde sale el ticket */}
        <View
          style={[
            styles.ranura,
            isDark
              ? { backgroundColor: "#E5E7EB", borderColor: "#D1D5DB" }
              : { backgroundColor: "#232328", borderColor: "#2E2E34" },
          ]}
        />
      </View>

      {/* 2. CUERPO DEL TICKET (PAPEL) */}
      <View
        style={[
          styles.papel,
          {
            backgroundColor: colorPapel,
            borderColor: c.borde,
          },
        ]}
      >
        {/* Cabecera tocable con foto cuadrada chica y título completo */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Ver publicación ${pedido.producto}`}
          onPress={() => openProduct(pedido.productoId)}
          scaleTo={0.97}
          style={styles.cabeceraProducto}
        >
          <View style={[styles.fotoCuadrada, { backgroundColor: c.neutro }]}>
            {product?.imageUri ? (
              <Image
                source={{ uri: product.imageUri }}
                contentFit="cover"
                transition={200}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <Ionicons name="storefront-outline" size={20} color={c.suave} />
            )}
          </View>

          <Text
            numberOfLines={2}
            style={[INTER.semibold, styles.nombreProducto, { color: c.texto }]}
          >
            {pedido.producto}
          </Text>
        </PressableScale>

        <LineaPunteada color={c.linea} />

        {/* Datos meta del ticket con muescas laterales */}
        <View style={styles.metaBloque}>
          <View
            pointerEvents="none"
            style={[
              styles.muesca,
              styles.muescaIzq,
              { backgroundColor: colorMuesca, borderColor: c.borde },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.muesca,
              styles.muescaDer,
              { backgroundColor: colorMuesca, borderColor: c.borde },
            ]}
          />

          <View style={styles.metaFila}>
            <Text style={[INTER.medium, styles.metaLabel, { color: c.suave }]}>
              HORA
            </Text>
            <Text
              style={[
                INTER.medium,
                styles.metaValor,
                styles.tabular,
                { color: c.texto },
              ]}
            >
              {hora}
            </Text>
          </View>

          <View style={styles.metaFila}>
            <Text style={[INTER.medium, styles.metaLabel, { color: c.suave }]}>
              PAGO
            </Text>
            <View style={styles.pagoValor}>
              {efectivo ? (
                <MonedaIcon size={16} />
              ) : (
                <TarjetaPagoIcon size={14} />
              )}
              <Text
                style={[INTER.medium, styles.metaValor, { color: c.texto }]}
              >
                {nombreMetodo(pedido.metodo)}
              </Text>
            </View>
          </View>
        </View>

        <LineaPunteada color={c.linea} />

        {/* Encabezado de tabla tipo recibo */}
        <View style={styles.tablaHeader}>
          <Text style={[INTER.semibold, styles.tablaCol, { color: c.suave }]}>
            ARTÍCULO
          </Text>
          <Text style={[INTER.semibold, styles.tablaCol, { color: c.suave }]}>
            IMPORTE
          </Text>
        </View>

        {/* Lista de ítems */}
        <View style={styles.itemsLista}>
          {pedido.items.map((item) => (
            <View key={item.nombre} style={styles.itemFila}>
              <Text
                numberOfLines={2}
                style={[INTER.medium, styles.itemNombre, { color: c.texto }]}
              >
                <Text style={[INTER.semibold, { color: c.suave }]}>
                  {item.cantidad}×{" "}
                </Text>
                {item.nombre}
              </Text>
              <Text
                style={[
                  INTER.medium,
                  styles.itemPrecio,
                  styles.tabular,
                  { color: c.texto },
                ]}
              >
                {formatearDinero(item.precio * item.cantidad)}
              </Text>
            </View>
          ))}
        </View>

        <LineaPunteada color={c.linea} />

        {/* Total */}
        <View style={styles.totalFila}>
          <Text style={[INTER.semibold, styles.totalLabel, { color: c.texto }]}>
            TOTAL
          </Text>
          <Text
            style={[
              INTER.semibold,
              styles.totalMonto,
              styles.tabular,
              { color: c.texto },
            ]}
          >
            {formatearDinero(pedido.total)}
          </Text>
        </View>

        {/* Nota integrada al estilo del recibo: sin ícono, entrecomillada y en cursiva */}
        {tieneNota ? (
          <>
            <LineaPunteada color={c.linea} />
            <Text style={[INTER.regular, styles.notaTexto, { color: c.suave }]}>
              “{pedido.nota.trim()}”
            </Text>
          </>
        ) : null}

        {/* Aviso para el vendedor cuando el pago es por transferencia */}
        {!mia && !efectivo ? (
          <Text style={[INTER.regular, styles.avisoTexto, { color: c.suave }]}>
            Paga por transferencia · Envía tu tarjeta desde la billetera de
            arriba.
          </Text>
        ) : null}
      </View>

      {/* 3. BORDE INFERIOR ONDULADO DEL TICKET */}
      <BordeOndulado ancho={ANCHO_PAPEL} fill={colorPapel} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: ANCHO,
    alignItems: "center",
    marginVertical: 8,
  },
  // Cabezal compacto con contraste invertido según el tema
  impresora: {
    width: ANCHO_IMPRESORA,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
    zIndex: 2,
    shadowColor: "#000000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  impresoraTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  impresoraIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  impresoraTitulo: {
    fontSize: 13,
  },
  impresoraMetodo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6.5,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  impresoraMetodoTexto: {
    fontSize: 11,
  },
  ranura: {
    height: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  // Papel del ticket que sale debajo de la ranura
  papel: {
    width: ANCHO_PAPEL,
    marginTop: -5,
    paddingTop: 15,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    gap: 9,
    zIndex: 1,
  },
  cabeceraProducto: {
    alignItems: "center",
    gap: 7,
  },
  fotoCuadrada: {
    width: 46,
    height: 46,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  nombreProducto: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: "center",
  },
  punteada: {
    height: 1,
    overflow: "hidden",
  },
  punteadaBorde: {
    height: 4,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  metaBloque: {
    position: "relative",
    gap: 5,
    paddingVertical: 1,
  },
  muesca: {
    position: "absolute",
    top: "50%",
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  muescaIzq: {
    left: -21,
  },
  muescaDer: {
    right: -21,
  },
  metaFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  metaValor: {
    fontSize: 12,
  },
  pagoValor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tablaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -2,
  },
  tablaCol: {
    fontSize: 10,
    letterSpacing: 0.6,
  },
  itemsLista: {
    gap: 6,
  },
  itemFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  itemNombre: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  itemPrecio: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  totalFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 12.5,
    letterSpacing: 0.6,
  },
  totalMonto: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  notaTexto: {
    fontSize: 12.5,
    lineHeight: 17.5,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 1,
  },
  avisoTexto: {
    fontSize: 11,
    lineHeight: 15.5,
    textAlign: "center",
  },
  onduladoSvg: {
    marginTop: -1,
  },
});
