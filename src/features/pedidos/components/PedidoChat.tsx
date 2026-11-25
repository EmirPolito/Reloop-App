import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useProduct } from "@/features/marketplace/hooks/useProductsByIds";
import { useNavegacion } from "@/features/navigation/useNavegacion";

import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { coloresPedido } from "../colores";
import { formatearDinero, nombreMetodo, type Pedido } from "../formatoPedido";
import { MonedaIcon, TarjetaPagoIcon } from "./IconosPago";

const ANCHO = 260;

/**
 * El pedido en el chat: la foto de la publicación (al tocarla, la abre), cada producto con su cantidad, el total, cómo se va a
 * pagar y lo que escribió quien pide. Al vendedor le recuerda mandar su tarjeta si es por
 * transferencia.
 */
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

  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: c.tarjeta,
          borderColor: c.borde,
          alignSelf: mia ? "flex-end" : "flex-start",
        },
      ]}
    >
      <View style={styles.encabezado}>
        <View style={styles.tituloFila}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Ver publicación ${pedido.producto}`}
            onPress={() => openProduct(pedido.productoId)}
            scaleTo={0.92}
            style={[styles.foto, { backgroundColor: c.neutro }]}
          >
            {product?.imageUri ? (
              <Image
                source={{ uri: product.imageUri }}
                contentFit="cover"
                transition={200}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
          </PressableScale>
          <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
            Pedido
          </Text>
        </View>
        <View style={[styles.metodo, { backgroundColor: c.neutro }]}>
          {efectivo ? <MonedaIcon size={16} /> : <TarjetaPagoIcon size={16} />}
          <Text style={[INTER.medium, styles.metodoTexto, { color: c.texto }]}>
            {nombreMetodo(pedido.metodo)}
          </Text>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[INTER.regular, styles.producto, { color: c.suave }]}
      >
        {pedido.producto}
      </Text>

      <View style={styles.items}>
        {pedido.items.map((item) => (
          <View key={item.nombre} style={styles.fila}>
            <Text
              numberOfLines={1}
              style={[
                INTER.regular,
                styles.linea,
                styles.nombre,
                { color: c.texto },
              ]}
            >
              {item.cantidad} × {item.nombre}
            </Text>
            <Text style={[INTER.medium, styles.linea, { color: c.texto }]}>
              {formatearDinero(item.precio * item.cantidad)}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.punteada, { borderColor: c.linea }]} />
      <View style={styles.fila}>
        <Text style={[INTER.semibold, styles.total, { color: c.texto }]}>
          Total
        </Text>
        <Text style={[INTER.semibold, styles.total, { color: c.texto }]}>
          {formatearDinero(pedido.total)}
        </Text>
      </View>

      <Text
        style={[
          INTER.regular,
          styles.nota,
          { color: c.texto, backgroundColor: c.neutro },
        ]}
      >
        {pedido.nota}
      </Text>

      {!mia && !efectivo ? (
        <Text style={[INTER.regular, styles.aviso, { color: c.suave }]}>
          Paga por transferencia: mándale tu tarjeta desde la billetera de
          arriba.
        </Text>
      ) : null}

      <Text style={[INTER.regular, styles.hora, { color: c.suave }]}>
        {hora}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: ANCHO,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginVertical: 5,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tituloFila: { flexDirection: "row", alignItems: "center", gap: 8 },
  foto: { width: 32, height: 32, borderRadius: 9, overflow: "hidden" },
  titulo: { fontSize: 15 },
  metodo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metodoTexto: { fontSize: 12 },
  producto: { fontSize: 12.5, marginTop: -4 },
  items: { gap: 6, marginTop: 2 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  nombre: { flex: 1 },
  linea: { fontSize: 13.5 },
  punteada: { borderTopWidth: 1, borderStyle: "dashed", marginVertical: 2 },
  total: { fontSize: 15 },
  nota: {
    fontSize: 13.5,
    lineHeight: 19,
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  aviso: { fontSize: 12, lineHeight: 17 },
  hora: { fontSize: 11.5, alignSelf: "flex-end" },
});
