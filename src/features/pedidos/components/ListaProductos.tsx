import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT_CUBIC } from "@/constants/motion";
import type { ProductOption } from "@/features/marketplace/types";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { coloresPedido } from "../colores";
import { formatearDinero } from "../formatoPedido";

const LADO_FOTO = 84;
/** El número entra desde abajo al subir y desde arriba al bajar, corto y suave */
const SUBE = FadeInDown.duration(170).easing(EASE_OUT_CUBIC);
const BAJA = FadeInUp.duration(170).easing(EASE_OUT_CUBIC);
const APARECE = ZoomIn.duration(160).easing(EASE_OUT_CUBIC);
const DESAPARECE = ZoomOut.duration(120);

function tocar() {
  Haptics.selectionAsync().catch(() => undefined);
}

function BotonCantidad({
  icono,
  etiqueta,
  disabled,
  onPress,
}: {
  icono: "remove" | "add";
  etiqueta: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tocar();
        onPress();
      }}
      scaleTo={0.84}
      hitSlop={8}
      style={[
        styles.cantidadBoton,
        // Gris sobre la tarjeta blanca: se distingue sin borde
        { backgroundColor: c.neutro, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Ionicons name={icono} size={15} color={c.texto} />
    </PressableScale>
  );
}

/** La cantidad: el número nuevo rueda en la dirección del cambio */
function Cantidad({ valor, nombre }: { valor: number; nombre: string }) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const [anterior, setAnterior] = useState(valor);
  const [subio, setSubio] = useState(true);
  if (valor !== anterior) {
    setSubio(valor > anterior);
    setAnterior(valor);
  }
  return (
    <View style={styles.numeroCaja}>
      <Animated.Text
        key={valor}
        entering={subio ? SUBE : BAJA}
        accessibilityLabel={`${valor} de ${nombre}`}
        style={[INTER.medium, styles.numero, { color: c.texto }]}
      >
        {valor}
      </Animated.Text>
    </View>
  );
}

/**
 * Los productos que se pueden pedir de una publicación de venta o comida: foto a la izquierda;
 * el nombre (con una X para quitarlo) y su descripción corta; abajo el precio y la cantidad.
 */
export function ListaProductos({
  opciones,
  cantidades,
  maximo,
  onCambiar,
}: {
  opciones: readonly ProductOption[];
  cantidades: Readonly<Record<string, number>>;
  /** Cuántos se pueden pedir de cada uno */
  maximo: number;
  onCambiar: (id: string, cantidad: number) => void;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  return (
    <View style={styles.lista}>
      {opciones.map((opcion) => {
        const cantidad = cantidades[opcion.id] ?? 0;
        const foto = optimizedImageUrl(opcion.imageUri, 240);
        return (
          <View
            key={opcion.id}
            style={[styles.fila, { backgroundColor: c.tarjeta }]}
          >
            <View style={[styles.foto, { backgroundColor: c.neutro }]}>
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  contentFit="cover"
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <Ionicons name="image-outline" size={24} color={c.suave} />
              )}
            </View>
            <View style={styles.datos}>
              <View style={styles.arriba}>
                <View style={styles.textos}>
                  <Text
                    numberOfLines={1}
                    style={[INTER.medium, styles.nombre, { color: c.texto }]}
                  >
                    {opcion.name}
                  </Text>
                  {opcion.description ? (
                    <Text
                      numberOfLines={2}
                      style={[
                        INTER.regular,
                        styles.descripcion,
                        { color: c.suave },
                      ]}
                    >
                      {opcion.description}
                    </Text>
                  ) : null}
                </View>
                {cantidad > 0 ? (
                  <Animated.View entering={APARECE} exiting={DESAPARECE}>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${opcion.name}`}
                      onPress={() => {
                        tocar();
                        onCambiar(opcion.id, 0);
                      }}
                      scaleTo={0.84}
                      hitSlop={10}
                    >
                      <Ionicons name="close-circle" size={20} color={c.suave} />
                    </PressableScale>
                  </Animated.View>
                ) : null}
              </View>
              <View style={styles.abajo}>
                <Text
                  style={[INTER.semibold, styles.precio, { color: c.texto }]}
                >
                  {formatearDinero(opcion.price)}
                </Text>
                <View style={styles.cantidad}>
                  <BotonCantidad
                    icono="remove"
                    etiqueta={`Quitar uno de ${opcion.name}`}
                    disabled={cantidad === 0}
                    onPress={() => onCambiar(opcion.id, cantidad - 1)}
                  />
                  <Cantidad valor={cantidad} nombre={opcion.name} />
                  <BotonCantidad
                    icono="add"
                    etiqueta={`Agregar uno de ${opcion.name}`}
                    disabled={cantidad >= maximo}
                    onPress={() => onCambiar(opcion.id, cantidad + 1)}
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 10 },
  // Fondo blanco, sin borde
  fila: { flexDirection: "row", gap: 12, padding: 8, borderRadius: 20 },
  foto: {
    width: LADO_FOTO,
    height: LADO_FOTO,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  datos: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  arriba: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  textos: { flex: 1, gap: 2 },
  nombre: { fontSize: 14.5 },
  descripcion: { fontSize: 12.5, lineHeight: 17 },
  abajo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  precio: { fontSize: 15.5 },
  cantidad: { flexDirection: "row", alignItems: "center", gap: 8 },
  cantidadBoton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  numeroCaja: {
    width: 20,
    height: 20,
    overflow: "hidden",
    alignItems: "center",
  },
  numero: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
