import { Ionicons } from "@expo/vector-icons";
import type { ComponentRef, RefObject } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { CabeceraFlotante } from "@/components/ui/CabeceraFlotante";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { IconoEliminarLinea } from "@/features/perfil/iconosPerfil";
import { Text } from "@/features/shared/Text";

/** Todas o las de una categoría */
export type Filtro = "todas" | CategoryId;

const OPCIONES: { id: Filtro; texto: string }[] = [
  { id: "todas", texto: "Todas" },
  ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
];

/**
 * El encabezado flotante, sin tarjeta de fondo (la lista pasa por detrás): volver (o cancelar
 * la selección), el título al centro y el bote a la derecha; debajo, el buscador y las
 * píldoras por categoría. Al seleccionar, el bote se pone rojo con algo marcado y es el
 * destino al que vuelan las tarjetas quitadas.
 */
export function CabeceraFavoritos({
  desplazado,
  onAlto,
  texto,
  isDark,
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
  filtro,
  onFiltrar,
}: {
  desplazado: SharedValue<number>;
  onAlto: (alto: number) => void;
  texto: string;
  isDark: boolean;
  seleccionando: boolean;
  /** Cuántos hay marcados */
  marcados: number;
  destinoRef: RefObject<ComponentRef<typeof View> | null>;
  onVolver: () => void;
  onCancelarSeleccion: () => void;
  onEliminarMarcados: () => void;
  onAbrirMenu: () => void;
  busqueda: string;
  onBuscar: (texto: string) => void;
  buscaPersonas: boolean;
  filtro: Filtro;
  onFiltrar: (filtro: Filtro) => void;
}) {
  return (
    <CabeceraFlotante paddingTop={8} desplazado={desplazado} onAlto={onAlto}>
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
              ? "Selecciona favoritos"
              : `${marcados} seleccionado${marcados === 1 ? "" : "s"}`
            : "Favoritos"}
        </Text>
        {seleccionando ? (
          // Destino del efecto: hacia aquí vuelan las tarjetas quitadas
          <View ref={destinoRef} collapsable={false}>
            <BotonBarra
              etiqueta="Quitar favoritos seleccionados"
              // Con algo marcado: fondo rojo e icono blanco
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
          // Siempre blanco, haya o no favoritos (sin favoritos, la opción del menú se apaga)
          <BotonBarra etiqueta="Eliminar favoritos" onPress={onAbrirMenu}>
            <IconoEliminarLinea size={26} color={isDark ? "#FFFFFF" : texto} />
          </BotonBarra>
        )}
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={onBuscar}
        placeholder="Buscar favoritos o @usuario"
        accessibilityLabel="Buscar en favoritos"
        personas={buscaPersonas}
      />

      <FiltrosPildoras
        opciones={OPCIONES}
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
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
});
