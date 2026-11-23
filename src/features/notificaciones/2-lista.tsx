import { Skeleton } from "heroui-native";
import { useCallback } from "react";
import {
  SectionList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type SectionListData,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { Disolvedor } from "@/components/ui/Disolvible";
import { IconoNotificacionRellena } from "@/components/ui/IconoNotificacion";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { SwipeParaEliminar } from "@/components/ui/SwipeParaEliminar";
import { Text } from "@/features/shared/Text";
import { FilaNotificacion } from "./components/FilaNotificacion";
import type { NotificationSection } from "./reglasNotificaciones";
import type { AppNotification } from "./tipos";

/** Tarjetas de carga mientras llegan las notificaciones */
const FILAS_ESQUELETO = 6;

const claveNotificacion = (item: AppNotification) => item.id;

/**
 * Las notificaciones agrupadas por antigüedad (Hoy, Esta semana...). Cada tarjeta se desliza
 * a la izquierda para eliminarla y se registra para el efecto de volar al bote.
 */
export function ListaNotificaciones({
  secciones,
  now,
  isDark,
  seleccionando,
  marcados,
  registrar,
  contenido,
  alHacerScroll,
  onPress,
  onLongPress,
  onEliminar,
  vacio,
}: {
  secciones: NotificationSection[];
  /** Un solo "ahora" para toda la lista: las antigüedades no bailan entre renders */
  now: number;
  isDark: boolean;
  seleccionando: boolean;
  marcados: ReadonlySet<string>;
  registrar: (id: string, disolvedor: Disolvedor | null) => void;
  /** Rellenos de la lista: empieza bajo el encabezado y termina sobre el nav */
  contenido: StyleProp<ViewStyle>;
  alHacerScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onPress: (notificacion: AppNotification) => void;
  onLongPress: (notificacion: AppNotification) => void;
  /** Si falla, la promesa se rechaza y la tarjeta vuelve */
  onEliminar: (id: string) => Promise<void>;
  /** Título y mensaje cuando no hay nada que mostrar */
  vacio: { titulo: string; mensaje: string };
}) {
  const suave = isDark ? "#94A3B8" : "#8A8A8F";

  const renderEncabezado = useCallback(
    ({
      section,
    }: {
      section: SectionListData<AppNotification, NotificationSection>;
    }) => (
      <Text style={[estilos.seccion, { color: suave }]}>{section.title}</Text>
    ),
    [suave],
  );
  const renderFila = useCallback(
    ({ item }: { item: AppNotification }) => (
      <SwipeParaEliminar
        disabled={seleccionando}
        radio={22}
        separacion={9}
        onDelete={() => onEliminar(item.id)}
      >
        <FilaNotificacion
          notification={item}
          now={now}
          onPress={onPress}
          onLongPress={onLongPress}
          seleccionando={seleccionando}
          marcada={marcados.has(item.id)}
          registrar={registrar}
        />
      </SwipeParaEliminar>
    ),
    [seleccionando, onEliminar, now, onPress, onLongPress, marcados, registrar],
  );

  return (
    <SectionList
      onScroll={alHacerScroll}
      scrollEventThrottle={16}
      sections={secciones}
      extraData={marcados}
      keyExtractor={claveNotificacion}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={contenido}
      renderSectionHeader={renderEncabezado}
      renderItem={renderFila}
      ListEmptyComponent={
        <IllustratedEmptyState
          icon={
            <IconoNotificacionRellena
              size={80}
              color={isDark ? "#334155" : "#D9D9DE"}
            />
          }
          title={vacio.titulo}
          message={vacio.mensaje}
          style={estilos.vacio}
        />
      }
    />
  );
}

/** Mientras cargan: tarjetas de carga (el `Skeleton` de HeroUI) del tamaño de las reales */
export function EsqueletoNotificaciones({ isDark }: { isDark: boolean }) {
  return (
    <View
      accessibilityLabel="Cargando notificaciones"
      accessibilityRole="progressbar"
      style={estilos.esqueleto}
    >
      {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
        <View
          key={i}
          style={[
            estilos.esqueletoFila,
            { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" },
          ]}
        >
          <Skeleton className="size-11 rounded-full" />
          <View style={estilos.esqueletoTextos}>
            <Skeleton className="h-2.5 w-3/5 rounded-md" />
            <Skeleton className="h-2.5 w-4/5 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  // A la misma altura que en favoritos (su lista empieza 12 más abajo y su vacío lleva 110)
  vacio: { paddingTop: 122, paddingBottom: 162 },
  esqueleto: { paddingHorizontal: 15, paddingTop: 12, gap: 9 },
  esqueletoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 22,
  },
  esqueletoTextos: { flex: 1, gap: 8 },
});
