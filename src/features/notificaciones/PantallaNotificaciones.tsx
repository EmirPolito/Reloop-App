import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { useScrollCabecera } from "@/components/ui/CabeceraFlotante";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { ENTRADA_MODULO } from "@/constants/motion";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { CATEGORIES } from "@/features/marketplace/data";
import { useMarketplaceState } from "@/features/marketplace/MarketplaceProvider";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/nombreUsuario";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { CabeceraNotificaciones, type Filtro } from "./1-cabecera";
import { EsqueletoNotificaciones, ListaNotificaciones } from "./2-lista";
import { useAbrirNotificacion } from "./hooks/useAbrirNotificacion";
import {
  useNotificationActions,
  useNotifications,
} from "./ProveedorNotificaciones";
import {
  groupNotifications,
  notificationMessage,
  notificationTitle,
} from "./reglasNotificaciones";
import type { AppNotification } from "./tipos";

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);

/**
 * Todas las notificaciones recibidas, por antigüedad, con buscador y filtros (ver
 * `README.md`). El encabezado flota arriba y la lista pasa por detrás.
 */
export function PantallaNotificaciones() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useNavegacion();
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
  const openNotification = useAbrirNotificacion();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const { desplazado, alHacerScroll, reiniciar } = useScrollCabecera();
  // Cada filtro monta la lista de nuevo, desde arriba
  useEffect(reiniciar, [filtro, reiniciar]);
  const [busqueda, setBusqueda] = useState("");
  // Un solo "ahora" para toda la lista: las antigüedades no bailan entre renders
  const [now] = useState(() => Date.now());

  // Categoría de cada publicación, para filtrar las notificaciones que hablan de ellas
  const categoriaDe = useMemo(
    () => new Map(products.map((p) => [p.id, p.category])),
    [products],
  );
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

  // Se recalculan solo cuando cambia algo que las afecta (antes, en cada dibujo: al escribir
  // en el buscador o marcar una, se volvía a filtrar y agrupar toda la lista)
  const visibles = useMemo(
    () =>
      notifications.filter((item) => {
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
      }),
    [notifications, filtro, categoriaDe, termino, buscaPersonas, perfiles],
  );
  const sections = useMemo(
    () => groupNotifications(visibles, now),
    [visibles, now],
  );

  const texto = isDark ? "#F1F5F9" : "#101010";

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
        : // Como en los demás módulos: sale con su animación y luego abre a dónde lleva
          conSalida(() => openNotification(notificacion)),
    [activo, seleccion, openNotification],
  );
  const iniciarSeleccion = useCallback(
    (notificacion: AppNotification) => seleccion.iniciar(notificacion.id),
    [seleccion],
  );

  const avisarEliminadas = useCallback(
    (cantidad: number) =>
      mostrar({
        tipo: "eliminada",
        titulo:
          cantidad === 1
            ? "Notificación eliminada"
            : `${cantidad} notificaciones eliminadas`,
        descripcion: "Se eliminaron correctamente.",
      }),
    [mostrar],
  );

  /** Las tarjetas a la vista vuelan al botón; al terminar se eliminan de verdad */
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
  const eliminarUna = useCallback(
    (id: string) =>
      remove([id]).then(
        () => avisarEliminadas(1),
        (error) => {
          showErrorAlert("No se pudo eliminar la notificación", error);
          throw error;
        },
      ),
    [remove, avisarEliminadas],
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
  const opciones = useMemo<{ id: Filtro; texto: string }[]>(
    () => [
      { id: "todas", texto: "Todas" },
      {
        id: "sinLeer",
        texto: unreadCount > 0 ? `Sin leer · ${unreadCount}` : "Sin leer",
      },
      ...CATEGORIES.map((c) => ({ id: c.id, texto: c.label })),
    ],
    [unreadCount],
  );

  const vacio = useMemo(
    () => ({
      titulo:
        status === "error"
          ? "No pudimos cargar tus notificaciones"
          : termino
            ? "No encontramos nada"
            : categoria
              ? `Nada de ${categoria.label.toLowerCase()}`
              : filtro === "sinLeer"
                ? "Estás al día"
                : "Aún no tienes notificaciones",
      mensaje:
        status === "error"
          ? "Revisa tu conexión e inténtalo de nuevo."
          : termino
            ? "Prueba con otro nombre o palabra."
            : categoria
              ? "Aquí verás lo que pase con tus publicaciones de ese tipo."
              : filtro === "sinLeer"
                ? "No te queda ninguna notificación por leer."
                : "Cuando alguien te siga, te escriba o reaccione a tus publicaciones, lo verás aquí.",
    }),
    [status, termino, categoria, filtro],
  );
  // La lista empieza bajo el encabezado; abajo deja espacio para que el nav no tape la última
  const contenido = useMemo(
    () => ({
      paddingHorizontal: 15,
      paddingTop: altoCabecera,
      paddingBottom: insets.bottom + 110,
    }),
    [altoCabecera, insets.bottom],
  );

  return (
    <View style={estilos.pantalla}>
      {status === "loading" ? (
        <View style={{ paddingTop: altoCabecera }}>
          <EsqueletoNotificaciones isDark={isDark} />
        </View>
      ) : (
        <Animated.View entering={ENTRADA} style={estilos.lista}>
          <Animated.View
            key={filtro}
            entering={CAMBIO_FILTRO}
            style={estilos.lista}
          >
            <ListaNotificaciones
              secciones={sections}
              now={now}
              isDark={isDark}
              seleccionando={activo}
              marcados={marcados}
              registrar={registrar}
              contenido={contenido}
              alHacerScroll={alHacerScroll}
              onPress={alPulsar}
              onLongPress={iniciarSeleccion}
              onEliminar={eliminarUna}
              vacio={vacio}
            />
          </Animated.View>
        </Animated.View>
      )}

      <CabeceraNotificaciones
        paddingTop={insets.top + 8}
        desplazado={desplazado}
        onAlto={setAltoCabecera}
        texto={texto}
        seleccionando={activo}
        marcados={marcados.size}
        destinoRef={destinoRef}
        onVolver={() => conSalida(back)}
        onCancelarSeleccion={seleccion.salir}
        onEliminarMarcados={eliminar}
        onAbrirMenu={() => setMenu(true)}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        buscaPersonas={buscaPersonas}
        opciones={opciones}
        filtro={filtro}
        onFiltrar={setFiltro}
      />

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

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  lista: { flex: 1 },
});
