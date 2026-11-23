import { Ionicons } from "@expo/vector-icons";
import type { RefObject, ComponentRef } from "react";
import { StyleSheet, View } from "react-native";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";
import { BackArrowIcon } from "./components/IconosConversacion";

/**
 * La barra de arriba de la lista: volver (o cancelar la selección), el título al centro y, a
 * la derecha, buscar y eliminar. Al seleccionar, el bote se pone rojo con algo marcado y es el
 * destino al que vuelan los chats eliminados.
 */
export function BarraChats({
  texto,
  seleccionando,
  marcados,
  destinoRef,
  onVolver,
  onCancelarSeleccion,
  onBuscar,
  onAbrirMenu,
  onEliminarMarcados,
}: {
  texto: string;
  seleccionando: boolean;
  /** Cuántos chats están marcados */
  marcados: number;
  destinoRef: RefObject<ComponentRef<typeof View> | null>;
  onVolver: () => void;
  onCancelarSeleccion: () => void;
  onBuscar: () => void;
  onAbrirMenu: () => void;
  onEliminarMarcados: () => void;
}) {
  return (
    <View style={estilos.barra}>
      {seleccionando ? (
        <BotonBarra etiqueta="Cancelar selección" onPress={onCancelarSeleccion}>
          <Ionicons name="close" size={26} color={texto} />
        </BotonBarra>
      ) : (
        <BotonBarra etiqueta="Volver" onPress={onVolver}>
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={texto} />
          </View>
        </BotonBarra>
      )}
      <Text
        accessibilityRole="header"
        pointerEvents="none"
        style={[estilos.titulo, { color: texto }]}
      >
        {seleccionando
          ? marcados === 0
            ? "Selecciona chats"
            : `${marcados} seleccionado${marcados === 1 ? "" : "s"}`
          : "Chats"}
      </Text>
      <View style={estilos.acciones}>
        {seleccionando ? (
          // Destino del efecto: hacia aquí vuelan los chats eliminados
          <View ref={destinoRef} collapsable={false}>
            <BotonBarra
              etiqueta="Eliminar chats seleccionados"
              // Con algo elegido: fondo rojo e icono blanco (igual en oscuro)
              peligro={marcados > 0}
              colorPeligro="#EF4444"
              // Sin nada elegido se ve blanco (no apagado) y no hace nada
              onPress={onEliminarMarcados}
            >
              <IconoEliminarLinea
                size={26}
                color={marcados > 0 ? "#FFFFFF" : texto}
              />
            </BotonBarra>
          </View>
        ) : (
          <>
            <BotonBarra etiqueta="Buscar chats" onPress={onBuscar}>
              <IconoBusqueda size={24} color={texto} grosorExtra={0.5} />
            </BotonBarra>
            {/* Siempre blanco, haya o no chats (sin chats, la opción del menú se apaga) */}
            <BotonBarra etiqueta="Eliminar chats" onPress={onAbrirMenu}>
              <IconoEliminarLinea size={26} color={texto} />
            </BotonBarra>
          </>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    height: 56,
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  acciones: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Centrado en la barra, sin importar el ancho de los botones
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
});
