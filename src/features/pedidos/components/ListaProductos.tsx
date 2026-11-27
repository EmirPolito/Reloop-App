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
import { VisorImagenes } from "@/features/chats/components/VisorImagenes";
import type { ProductOption } from "@/features/marketplace/types";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { coloresPedido } from "../colores";
import { formatearDinero } from "../formatoPedido";

const LADO_FOTO = 92;
const SIN_FOTOS: string[] = [];
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
        { backgroundColor: c.neutro, opacity: disabled ? 0.45 : 1 },
      ]}
    >
      <Ionicons name={icono} size={16} color={c.texto} />
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
        style={[INTER.semibold, styles.numero, { color: c.texto }]}
      >
        {valor}
      </Animated.Text>
    </View>
  );
}

/**
 * Los productos que se pueden pedir de una publicación de venta o comida: foto a la izquierda
 * (tocarla la abre en grande); el nombre (con una X para quitarlo) y su descripción corta;
 * abajo el precio y la cantidad, que no pasa de lo que tiene el vendedor (el "+" se apaga).
 */
export function ListaProductos({
  opciones,
  cantidades,
  maximo,
  onCambiar,
}: {
  opciones: readonly ProductOption[];
  cantidades: Readonly<Record<string, number>>;
  /** Cuántos se pueden pedir de cada uno como mucho (también si el vendedor tiene más) */
  maximo: number;
  onCambiar: (id: string, cantidad: number) => void;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  // La foto que se ve en grande (ninguna: el visor cerrado)
  const [enGrande, setEnGrande] = useState<string[]>(SIN_FOTOS);
  return (
    <View style={styles.lista}>
      {opciones.map((opcion) => {
        const cantidad = cantidades[opcion.id] ?? 0;
        const foto = optimizedImageUrl(opcion.imageUri, 240);
        // Lo que tiene el vendedor (las de antes no lo dicen: solo el máximo general)
        const tope =
          opcion.available === undefined
            ? maximo
            : Math.min(opcion.available, maximo);
        return (
          <View
            key={opcion.id}
            style={[styles.fila, { backgroundColor: c.tarjeta }]}
          >
            <PressableScale
              accessibilityRole="imagebutton"
              accessibilityLabel={`Ver en grande la foto de ${opcion.name}`}
              disabled={!opcion.imageUri}
              onPress={() => opcion.imageUri && setEnGrande([opcion.imageUri])}
              scaleTo={0.94}
              style={[styles.foto, { backgroundColor: c.neutro }]}
            >
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  contentFit="cover"
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <Ionicons name="image-outline" size={24} color={c.suave} />
              )}
            </PressableScale>
            <View style={styles.datos}>
              <View style={styles.arriba}>
                <View style={styles.textos}>
                  <Text
                    numberOfLines={1}
                    style={[INTER.semibold, styles.nombre, { color: c.texto }]}
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
                      <Ionicons name="close-circle" size={21} color={c.suave} />
                    </PressableScale>
                  </Animated.View>
                ) : null}
              </View>
              <View style={styles.abajo}>
                <Text style={[INTER.bold, styles.precio, { color: c.texto }]}>
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
                    disabled={cantidad >= tope}
                    onPress={() => onCambiar(opcion.id, cantidad + 1)}
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}
      <VisorImagenes
        images={enGrande}
        initialIndex={0}
        onClose={() => setEnGrande(SIN_FOTOS)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Un poco más separadas
  lista: { gap: 14 },
  // Tarjeta blanca del alto de la foto: la foto va pegada a la orilla
  fila: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 18,
    overflow: "hidden",
  },
  // Cuadrada con sus cuatro esquinas redondas (las mismas de la tarjeta)
  foto: {
    width: LADO_FOTO,
    height: LADO_FOTO,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  // Los datos ocupan la altura de la foto: el nombre arriba y el precio abajo
  datos: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingRight: 10,
  },
  arriba: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  textos: { flex: 1, gap: 2 },
  nombre: { fontSize: 15 },
  descripcion: { fontSize: 12.5, lineHeight: 17 },
  abajo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  precio: { fontSize: 16 },
  cantidad: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Cuadrado con esquinas redondas; el gris lo pone el tema
  cantidadBoton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  numeroCaja: {
    width: 20,
    height: 20,
    overflow: "hidden",
    alignItems: "center",
  },
  numero: { fontSize: 15, lineHeight: 20, textAlign: "center" },
});
