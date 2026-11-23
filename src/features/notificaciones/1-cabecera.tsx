import { Ionicons } from "@expo/vector-icons";
import type { ComponentRef, RefObject } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { CabeceraFlotante } from "@/components/ui/CabeceraFlotante";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import type { CategoryId } from "@/features/marketplace/types";
import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";

/** Todas, las no leídas o las de publicaciones de una categoría */
export type Filtro = "todas" | "sinLeer" | CategoryId;

/** Iconos de los botones redondos del encabezado */
const ICONO_ATRAS = 28;

/**
 * El encabezado flotante, sin tarjeta de fondo (la lista pasa por detrás): volver (o cancelar
 * la selección), el título al centro y más opciones a la derecha; debajo, el buscador blanco
 * y las píldoras de filtro. Al seleccionar, el bote rojo es el destino al que vuelan las
 * tarjetas eliminadas.
 */
export function CabeceraNotificaciones({
  paddingTop,
  desplazado,
  onAlto,
  texto,
  seleccionando,
  marcados,
  destinoRef,
  onVolver,
  onCancelarSeleccion,
  onEliminarMarcados,
  onAbrirMenu,
  busqueda,
  onBuscar,
  buscaPersonas,
  opciones,
  filtro,
  onFiltrar,
}: {
  paddingTop: number;
  desplazado: SharedValue<number>;
  onAlto: (alto: number) => void;
  texto: string;
  seleccionando: boolean;
  /** Cuántas hay marcadas */
  marcados: number;
  destinoRef: RefObject<ComponentRef<typeof View> | null>;
  onVolver: () => void;
  onCancelarSeleccion: () => void;
  onEliminarMarcados: () => void;
  onAbrirMenu: () => void;
  busqueda: string;
  onBuscar: (texto: string) => void;
  buscaPersonas: boolean;
  opciones: { id: Filtro; texto: string }[];
  filtro: Filtro;
  onFiltrar: (filtro: Filtro) => void;
}) {
  return (
    <CabeceraFlotante
      paddingTop={paddingTop}
      desplazado={desplazado}
      onAlto={onAlto}
    >
      <View style={estilos.barra}>
        {seleccionando ? (
          <BotonBarra
            etiqueta="Cancelar selección"
            onPress={onCancelarSeleccion}
          >
            <Ionicons name="close" size={26} color={texto} />
          </BotonBarra>
        ) : (
          <BotonBarra etiqueta="Volver" onPress={onVolver}>
            <View style={estilos.flecha}>
              <BackArrowIcon size={ICONO_ATRAS} color={texto} />
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
              ? "Selecciona"
              : `${marcados} seleccionada${marcados === 1 ? "" : "s"}`
            : "Notificaciones"}
        </Text>

        <View style={estilos.acciones}>
          {seleccionando ? (
            // Destino del efecto: hacia aquí vuelan las tarjetas eliminadas
            <View ref={destinoRef} collapsable={false}>
              <BotonBarra
                etiqueta="Eliminar notificaciones seleccionadas"
                peligro
                colorPeligro="#EF4444"
                disabled={marcados === 0}
                onPress={onEliminarMarcados}
              >
                <IconoEliminarLinea size={26} color="#FFFFFF" />
              </BotonBarra>
            </View>
          ) : (
            <BotonBarra etiqueta="Más opciones" onPress={onAbrirMenu}>
              <Ionicons name="ellipsis-horizontal" size={24} color={texto} />
            </BotonBarra>
          )}
        </View>
      </View>

      {/* Buscador blanco, como el del inicio */}
      <BuscadorBlanco
        value={busqueda}
        onChangeText={onBuscar}
        placeholder="Buscar notificaciones o @usuario"
        accessibilityLabel="Buscar notificaciones"
        personas={buscaPersonas}
      />

      <FiltrosPildoras
        opciones={opciones}
        activo={filtro}
        onCambiar={onFiltrar}
      />
    </CabeceraFlotante>
  );
}

const estilos = StyleSheet.create({
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flecha: { transform: [{ translateX: -1.5 }] },
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
