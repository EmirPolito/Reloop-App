import { Skeleton } from "heroui-native";
import { useCallback, type ReactNode } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { DeslizarConBoton } from "@/components/ui/DeslizarConBoton";
import type { Disolvedor } from "@/components/ui/Disolvible";
import {
  fondoCristalSuave,
  sombraCristalSuave,
} from "@/components/ui/cristalSuave";
import { coloresCristal } from "@/features/busqueda/components/PildoraCristal";
import type { CategoryId, Chat } from "@/features/marketplace/types";
import { FilaChat } from "./components/FilaChat";

/** Esquinas de la tarjeta de los chats */
export const RADIO_TARJETA = 26;
/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
/** Filas de carga mientras llegan los chats */
const FILAS_ESQUELETO = 6;

/** La tarjeta de cristal donde van los chats (la sombra por fuera: el recorte la cortaría) */
function TarjetaChats({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <View style={estilos.areaLista}>
      <View style={estilos.tarjetaSombra}>
        <View
          style={[
            estilos.tarjeta,
            {
              backgroundColor: fondoCristalSuave(isDark),
              borderColor: coloresCristal(isDark).borde,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

/** Mientras cargan los chats: filas de carga (el `Skeleton` de HeroUI) dentro de la tarjeta */
export function EsqueletoChats({ isDark }: { isDark: boolean }) {
  return (
    <TarjetaChats isDark={isDark}>
      <View accessibilityLabel="Cargando chats" accessibilityRole="progressbar">
        {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
          <View key={i} style={estilos.filaEsqueleto}>
            <Skeleton className="size-12 rounded-full" />
            <View style={estilos.textosEsqueleto}>
              <Skeleton className="h-2.5 w-1/2 rounded-md" />
              <Skeleton className="h-2.5 w-3/4 rounded-md" />
            </View>
          </View>
        ))}
      </View>
    </TarjetaChats>
  );
}

/**
 * Los chats dentro de la tarjeta grande, separados por una línea. La tarjeta crece con los
 * chats hasta el espacio que queda sobre la barra de navegación; si no caben, se desplazan
 * dentro. Cada fila se desliza a la izquierda para eliminarla.
 */
export function ListaChats({
  chats,
  filtro,
  isDark,
  categoriaPorProducto,
  sinLeerPorChat,
  seleccionando,
  marcados,
  registrar,
  onPress,
  onLongPress,
  onEliminar,
}: {
  chats: Chat[];
  /** Con otro filtro las filas se montan de nuevo y aparecen con el fundido */
  filtro: string;
  isDark: boolean;
  /** Categoría de cada publicación por su id (buscarla así es directo) */
  categoriaPorProducto: ReadonlyMap<string, CategoryId>;
  sinLeerPorChat: Record<string, number>;
  seleccionando: boolean;
  marcados: ReadonlySet<string>;
  registrar: (id: string, disolvedor: Disolvedor | null) => void;
  onPress: (chatId: string) => void;
  onLongPress: (chatId: string) => void;
  onEliminar: (chatId: string) => void;
}) {
  const ultimo = chats.length - 1;
  const claveFila = useCallback(
    (chat: Chat) => `${filtro}:${chat.id}`,
    [filtro],
  );
  const renderFila = useCallback(
    ({ item, index }: { item: Chat; index: number }) => (
      <Animated.View entering={CAMBIO_FILTRO}>
        <DeslizarConBoton
          disabled={seleccionando}
          // El rojo respeta las esquinas redondas de la tarjeta
          radioArriba={index === 0 ? RADIO_TARJETA : 0}
          radioAbajo={index === ultimo ? RADIO_TARJETA : 0}
          onDelete={() => onEliminar(item.id)}
        >
          <FilaChat
            chat={item}
            categoria={
              item.productId
                ? categoriaPorProducto.get(item.productId)
                : undefined
            }
            sinLeer={item.unread ? (sinLeerPorChat[item.id] ?? 1) : 0}
            onPress={onPress}
            onLongPress={onLongPress}
            seleccionando={seleccionando}
            marcado={marcados.has(item.id)}
            registrar={registrar}
            ultimo={index === ultimo}
          />
        </DeslizarConBoton>
      </Animated.View>
    ),
    [
      seleccionando,
      ultimo,
      onEliminar,
      categoriaPorProducto,
      sinLeerPorChat,
      onPress,
      onLongPress,
      marcados,
      registrar,
    ],
  );

  return (
    <TarjetaChats isDark={isDark}>
      {/* Sin desenfoque: detrás solo hay el fondo liso, y animar la opacidad de la pantalla
          con un desenfoque tan grande hacía pesada la transición */}
      <FlatList
        // También redondeada: en Android el recorte de la tarjeta no siempre alcanza a la lista
        style={estilos.lista}
        data={chats}
        extraData={marcados}
        keyExtractor={claveFila}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        renderItem={renderFila}
      />
    </TarjetaChats>
  );
}

const estilos = StyleSheet.create({
  areaLista: { flex: 1 },
  // Sin crecer de más: abraza los chats hasta el espacio que queda. Misma sombra que los
  // botones de arriba: sin ella el cristal casi no se distingue del fondo
  tarjetaSombra: {
    flexShrink: 1,
    marginHorizontal: 12,
    marginTop: 6,
    borderRadius: RADIO_TARJETA,
    ...sombraCristalSuave,
  },
  tarjeta: {
    flexShrink: 1,
    borderWidth: 1,
    borderRadius: RADIO_TARJETA,
    overflow: "hidden",
  },
  lista: { flexGrow: 0, borderRadius: RADIO_TARJETA, overflow: "hidden" },
  filaEsqueleto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textosEsqueleto: { flex: 1, gap: 8 },
});
