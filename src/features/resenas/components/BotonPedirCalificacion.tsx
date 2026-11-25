import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { AZUL_PEDIR } from "@/features/pedidos/colores";
import { INTER } from "@/features/perfil/editar/editarTema";
import { Text } from "@/features/shared/Text";
import { useEstadoResena } from "../repositorioResenas";

/**
 * Al vendedor, en la conversación de una publicación de venta o comida: un botón largo, anclado
 * arriba del input, para
 * pedirle a la otra persona que lo califique. Se apaga cuando ya se pidió o ya lo calificó.
 */
export function BotonPedirCalificacion({
  productoId,
  compradorId,
  onPedir,
}: {
  productoId: string;
  compradorId: string;
  onPedir: () => Promise<void>;
}) {
  const estado = useEstadoResena(productoId, compradorId, {
    conSolicitud: true,
  });
  const [enviando, setEnviando] = useState(false);
  if (!estado) return null;

  const hecho = estado.resena !== null || estado.solicitada;
  const texto = estado.resena
    ? "Ya te calificó"
    : estado.solicitada
      ? "Calificación pedida"
      : enviando
        ? "Pidiendo…"
        : "Pedir calificación";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: hecho || enviando }}
      disabled={hecho || enviando}
      onPress={() => {
        setEnviando(true);
        onPedir().finally(() => setEnviando(false));
      }}
      scaleTo={0.97}
      style={[styles.boton, { opacity: hecho ? 0.5 : 1 }]}
    >
      <Ionicons
        name={hecho ? "checkmark-circle" : "star"}
        size={17}
        color="#FFFFFF"
      />
      <Text style={[INTER.semibold, styles.texto]}>{texto}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: AZUL_PEDIR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  texto: { color: "#FFFFFF", fontSize: 14.5 },
});
