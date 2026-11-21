import { Ionicons } from "@expo/vector-icons";
import { IconoEliminarLinea } from "@/features/perfil/Perfiliconos";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionList, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { SwipeParaEliminar } from "@/components/ui/SwipeParaEliminar";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import {
  CabeceraFlotante,
  useScrollCabecera,
} from "@/components/ui/CabeceraFlotante";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IconoNotificacionRellena } from "@/components/ui/IconoNotificacion";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ENTRADA_MODULO } from "@/constants/motion";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { CATEGORIES } from "@/features/marketplace/data";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import type { AppNotification } from "./types";
import { NotificationItem } from "./components/NotificationItem";
import { useOpenNotification } from "./hooks/useOpenNotification";
import {
  groupNotifications,
  notificationMessage,
  notificationTitle,
} from "./notificationRules";
import {
  useNotificationActions,
  useNotifications,
} from "./NotificationsProvider";

/** Todas, las no leídas o las de publicaciones de una categoría */
type Filtro = "todas" | "sinLeer" | CategoryId;

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);

/** Iconos de los botones redondos del encabezado */
const ICONO_ATRAS = 28;

/** Todas las notificaciones recibidas, por antigüedad, con buscador y filtros. */
export function PantallaNotificaciones() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const { notifications, unreadCount, status } = useNotifications();
  const { markAllRead, remove } = useNotificationActions();
  const seleccion = useSeleccion();
  const [menu, setMenu] = useState(false);
  // Alto del encabezado flotante: la lista empieza debajo de él
  const [altoCabecera, setAltoCabecera] = useState(0);
  const { mostrar } = useAvisos();
  // Hacia el botón de eliminar vuelan las tarjetas (efecto Stream)
  const { destinoRef, registrar, eliminarConEfecto } = useEliminarConEfecto();
  const { products } = useMarketplaceState();
  const openNotification = useOpenNotification();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const { desplazado, alHacerScroll, reiniciar } = useScrollCabecera();
  // Cada filtro monta la lista de nuevo, desde arriba
  useEffect(reiniciar, [filtro, reiniciar]);
  const [busqueda, setBusqueda] = useState("");
  // Un solo "ahora" para toda la lista: las antigüedades no bailan entre renders
  const [now] = useState(() => Date.now());

  // Categoría de cada publicación, para filtrar las notificaciones que hablan de ellas
  const categoriaDe = new Map(products.map((p) => [p.id, p.category]));
  // Con "@" al inicio se buscan personas: sus notificaciones, por su usuario o su nombre
  const modoBusqueda = modoDeBusqueda(busqueda);
  const buscaPersonas = modoBusqueda.modo === "usuarios";
  const termino = buscaPersonas
    ? modoBusqueda.termino
    : busqueda.trim().toLocaleLowerCase();
  const actores = useMemo(
    () => [...new Set(notifications.map((item) => item.actorId))],
    [notifications],
  );
  const perfiles = usePerfilDe.varias(actores);

  const visibles = notifications.filter((item) => {
    if (filtro === "sinLeer" && item.read) return false;
    if (
      filtro !== "todas" &&
      filtro !== "sinLeer" &&
      (!item.productId || categoriaDe.get(item.productId) !== filtro)
    ) {
      return false;
    }
    if (!termino) return true;
    if (buscaPersonas) {
      const usuario = perfiles.get(item.actorId)?.username ?? "";
      return (
        usuario.includes(termino) ||
        normalizarNombre(item.actorName).includes(termino)
      );
    }
    return `${notificationTitle(item)} ${item.actorName} ${notificationMessage(item)}`
      .toLocaleLowerCase()
      .includes(termino);
  });
  const sections = groupNotifications(visibles, now);

  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#8A8A8F";

  const marcarTodas = () => {
    markAllRead().catch((error) =>
      showErrorAlert("No se pudieron marcar como leídas", error),
    );
  };

  const { activo, marcados } = seleccion;
  const alPulsar = useCallback(
    (notificacion: AppNotification) =>
      activo
        ? seleccion.alternar(notificacion.id)
        : openNotification(notificacion),
    [activo, seleccion, openNotification],
  );

  /** Las tarjetas a la vista vuelan al botón; al terminar se eliminan de verdad */
  const avisarEliminadas = (cantidad: number) =>
    mostrar({
      tipo: "eliminada",
      titulo:
        cantidad === 1
          ? "Notificación eliminada"
          : `${cantidad} notificaciones eliminadas`,
      descripcion: "Se eliminaron correctamente.",
    });

  const eliminarNotificaciones = (ids: string[]) =>
    eliminarConEfecto(ids, () => remove(ids))
      .then(() => {
        seleccion.salir();
        avisarEliminadas(ids.length);
      })
      .catch((error) =>
        showErrorAlert("No se pudieron eliminar las notificaciones", error),
      );

  /** Deslizar una tarjeta a la izquierda la elimina (si falla, la tarjeta vuelve) */
  const eliminarUna = (id: string) =>
    remove([id]).then(
      () => avisarEliminadas(1),
      (error) => {
        showErrorAlert("No se pudo eliminar la notificación", error);
        throw error;
      },
    );

  const eliminar = () => {
    const ids = [...marcados];
    if (ids.length === 0) return;
    showAlert(
      ids.length === 1
        ? "¿Eliminar esta notificación?"
        : `¿Eliminar ${ids.length} notificaciones?`,
      "No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void eliminarNotificaciones(ids);
          },
        },
      ],
    );
  };

  const categoria = CATEGORIES.find((c) => c.id === filtro);
  const opciones: { id: Filtro; texto: string }[] = [
    { id: "todas", texto: "Todas" },
    {
      id: "sinLeer",
      texto: unreadCount > 0 ? `Sin leer · ${unreadCount}` : "Sin leer",
    },
    ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
  ];

  return (
    <View style={styles.pantalla}>
      {status === "loading" ? (
        <View style={{ paddingTop: altoCabecera }}>
          <LoadingState />
        </View>
      ) : (
        <Animated.View entering={ENTRADA} style={styles.lista}>
          <Animated.View
            key={filtro}
            entering={CAMBIO_FILTRO}
            style={styles.lista}
          >
            <SectionList
              onScroll={alHacerScroll}
              scrollEventThrottle={16}
              sections={sections}
              extraData={marcados}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 15,
                paddingTop: altoCabecera,
                // Espacio para que la barra de navegación no tape la última tarjeta
                paddingBottom: insets.bottom + 110,
              }}
              renderSectionHeader={({ section }) => (
                <Text style={[styles.seccion, { color: suave }]}>
                  {section.title}
                </Text>
              )}
              renderItem={({ item }) => (
                <SwipeParaEliminar
                  disabled={activo}
                  radio={22}
                  separacion={9}
                  onDelete={() => eliminarUna(item.id)}
                >
                  <NotificationItem
                    notification={item}
                    now={now}
                    onPress={alPulsar}
                    onLongPress={(n) => seleccion.iniciar(n.id)}
                    seleccionando={activo}
                    marcada={marcados.has(item.id)}
                    registrar={registrar}
                  />
                </SwipeParaEliminar>
              )}
              ListEmptyComponent={
                <IllustratedEmptyState
                  icon={
                    <IconoNotificacionRellena
                      size={80}
                      color={isDark ? "#334155" : "#D9D9DE"}
                    />
                  }
                  title={
                    status === "error"
                      ? "No pudimos cargar tus notificaciones"
                      : termino
                        ? "No encontramos nada"
                        : categoria
                          ? `Nada de ${categoria.label.toLowerCase()}`
                          : filtro === "sinLeer"
                            ? "Estás al día"
                            : "Aún no tienes notificaciones"
                  }
                  message={
                    status === "error"
                      ? "Revisa tu conexión e inténtalo de nuevo."
                      : termino
                        ? "Prueba con otro nombre o palabra."
                        : categoria
                          ? "Aquí verás lo que pase con tus publicaciones de ese tipo."
                          : filtro === "sinLeer"
                            ? "No te queda ninguna notificación por leer."
                            : "Cuando alguien te siga, te escriba o reaccione a tus publicaciones, lo verás aquí."
                  }
                  style={styles.vacio}
                />
              }
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Encabezado flotante, sin tarjeta de fondo: la lista pasa por detrás */}
      <CabeceraFlotante
        paddingTop={insets.top + 8}
        desplazado={desplazado}
        onAlto={setAltoCabecera}
      >
        {/* Volver a la izquierda, el título al centro y marcar como leídas a la derecha */}
        <View style={styles.barra}>
          {activo ? (
            <BotonBarra etiqueta="Cancelar selección" onPress={seleccion.salir}>
              <Ionicons name="close" size={26} color={texto} />
            </BotonBarra>
          ) : (
            <BotonBarra etiqueta="Volver" onPress={() => conSalida(back)}>
              <View style={{ transform: [{ translateX: -1.5 }] }}>
                <BackArrowIcon size={ICONO_ATRAS} color={texto} />
              </View>
            </BotonBarra>
          )}

          <Text
            accessibilityRole="header"
            pointerEvents="none"
            style={[styles.titulo, { color: texto }]}
          >
            {activo
              ? marcados.size === 0
                ? "Selecciona"
                : `${marcados.size} seleccionada${marcados.size === 1 ? "" : "s"}`
              : "Notificaciones"}
          </Text>

          <View style={styles.acciones}>
            {activo ? (
              // Destino del efecto: hacia aquí vuelan las tarjetas eliminadas
              <View ref={destinoRef} collapsable={false}>
                <BotonBarra
                  etiqueta="Eliminar notificaciones seleccionadas"
                  peligro
                  colorPeligro="#EF4444"
                  disabled={marcados.size === 0}
                  onPress={eliminar}
                >
                  <IconoEliminarLinea size={26} color={"#FFFFFF"} />
                </BotonBarra>
              </View>
            ) : (
              <BotonBarra etiqueta="Más opciones" onPress={() => setMenu(true)}>
                <Ionicons name="ellipsis-horizontal" size={24} color={texto} />
              </BotonBarra>
            )}
          </View>
        </View>

        {/* Buscador blanco, como el del inicio */}
        <BuscadorBlanco
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar notificaciones o @usuario"
          accessibilityLabel="Buscar notificaciones"
          personas={buscaPersonas}
        />

        <FiltrosPildoras
          opciones={opciones}
          activo={filtro}
          onCambiar={setFiltro}
        />
      </CabeceraFlotante>

      <MenuOpciones
        visible={menu}
        top={insets.top + 8 + 56}
        onClose={() => setMenu(false)}
        opciones={[
          {
            etiqueta: "Marcar como leídas",
            icono: "checkmark-done",
            deshabilitada: unreadCount === 0,
            onPress: marcarTodas,
          },
          {
            etiqueta: "Seleccionar",
            icono: "checkmark-circle-outline",
            onPress: () => seleccion.iniciar(),
          },
          {
            etiqueta: "Seleccionar todo",
            icono: "checkbox-outline",
            onPress: () =>
              seleccion.iniciarTodos(visibles.map((item) => item.id)),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 56,
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
  lista: { flex: 1 },
  seccion: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  // Un poco más arriba: menos espacio sobre el icono que debajo
  vacio: { paddingTop: 138, paddingBottom: 162 },
});
