import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import type { CategoryId } from "@/features/marketplace/types";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useSiguiendo } from "@/features/perfil/hooks/useSiguiendo";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { BarraChats } from "./1-barra";
import { CarruselSeguidos } from "./2-seguidos";
import { PildorasSegmentadas } from "./3-filtros";
import { EsqueletoChats, ListaChats } from "./4-lista";
import { BulkMessageIcon, BulkSearchIcon } from "./components/IconosChats";
import { useAbrirChat } from "./hooks/useAbrirChat";
import { useMensajesSinLeer } from "./hooks/useMensajesSinLeer";
import { useChatActions, useChats } from "./ProveedorChats";

/** Todos, los que tienen mensajes sin leer o los que hablan de una publicación */
type Filtro = "todos" | "sinLeer" | "publicaciones";

/** Al eliminar varios, cuántos hacen el efecto de volar al bote */
const MAX_ANIMADOS = 3;
/**
 * Espacio bajo la tarjeta (sobre el área segura de abajo): termina por encima de la barra de
 * navegación, con aire entre las dos
 */
const ESPACIO_ABAJO = 76;

/**
 * Lista de chats (ver `README.md`): la barra de arriba, las personas que sigo en un carrusel,
 * las píldoras de filtro y las conversaciones en una tarjeta. Lo de arriba no se mueve: solo
 * se desplazan los chats, dentro de la tarjeta.
 */
export function PantallaChats() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { chats: todos, status } = useChats();
  const { deleteChats } = useChatActions();
  // Los chats que la persona eliminó no se listan (si escriben de nuevo, reaparecen)
  const chats = useMemo(() => todos.filter((chat) => !chat.hidden), [todos]);
  const seleccion = useSeleccion();
  const { activo, marcados, alternar, iniciar, iniciarTodos, salir } =
    seleccion;
  const [menu, setMenu] = useState(false);
  const { mostrar } = useAvisos();
  // Hacia el botón de eliminar vuelan los chats (efecto Stream)
  const { destinoRef, registrar, eliminarConEfecto } = useEliminarConEfecto();
  const { back, openThread, openChatSearch } = useNavegacion();
  const abrirChat = useAbrirChat();
  const siguiendo = useSiguiendo();
  // Estable: así el carrusel no se re-renderiza con la pantalla (eso lo hacía temblar)
  const escribirA = useCallback(
    (id: string, name: string) => void abrirChat({ id, name }),
    [abrirChat],
  );
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const productIds = useMemo(
    () => chats.flatMap((chat) => (chat.productId ? [chat.productId] : [])),
    [chats],
  );
  const { products } = useProductsByIds(productIds);
  // Por id: cada fila encuentra su categoría directo (antes recorría todas las publicaciones)
  const categoriaPorProducto = useMemo(
    () => new Map<string, CategoryId>(products.map((p) => [p.id, p.category])),
    [products],
  );
  const sinLeerPorChat = useMensajesSinLeer(chats);

  const sinLeer = useMemo(
    () => chats.filter((chat) => chat.unread).length,
    [chats],
  );
  const opciones = useMemo<{ id: Filtro; texto: string }[]>(
    () => [
      { id: "todos", texto: "Todos" },
      {
        id: "sinLeer",
        texto: sinLeer > 0 ? `Sin leer · ${sinLeer}` : "Sin leer",
      },
      { id: "publicaciones", texto: "Publicaciones" },
    ],
    [sinLeer],
  );

  const visibleChats = useMemo(
    () =>
      chats.filter((chat) =>
        filtro === "sinLeer"
          ? chat.unread
          : filtro === "publicaciones"
            ? Boolean(chat.productId)
            : true,
      ),
    [chats, filtro],
  );

  const texto = isDark ? "#F1F5F9" : "#101010";

  const alPulsar = useCallback(
    (chatId: string) =>
      activo
        ? alternar(chatId)
        : // Chats sale con su animación y luego entra la conversación
          conSalida(() => openThread(chatId)),
    [activo, alternar, openThread],
  );

  const avisarEliminados = useCallback(
    (cantidad: number) =>
      mostrar({
        tipo: "eliminada",
        titulo:
          cantidad === 1 ? "Chat eliminado" : `${cantidad} chats eliminados`,
        descripcion: "Se eliminaron solo para ti.",
      }),
    [mostrar],
  );

  /** Deslizar un chat a la izquierda deja ver Eliminar; al tocarlo se elimina (si falla, vuelve) */
  const eliminarUno = useCallback(
    (id: string) =>
      deleteChats([id]).then(
        () => avisarEliminados(1),
        (error) => {
          showErrorAlert("No se pudo eliminar el chat", error);
          throw error;
        },
      ),
    [deleteChats, avisarEliminados],
  );

  const eliminarMarcados = () => {
    const ids = [...marcados];
    if (ids.length === 0) return;
    showAlert(
      ids.length === 1
        ? "¿Eliminar este chat?"
        : `¿Eliminar ${ids.length} chats?`,
      "Se borran solo para ti. Si te vuelven a escribir, el chat reaparece con los mensajes nuevos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Solo los primeros vuelan al bote: con muchos a la vez el efecto se trababa
            eliminarConEfecto(ids, () => deleteChats(ids), MAX_ANIMADOS)
              .then(() => {
                salir();
                avisarEliminados(ids.length);
              })
              .catch((error) =>
                showErrorAlert("No se pudieron eliminar los chats", error),
              );
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        estilos.pantalla,
        { paddingBottom: insets.bottom + ESPACIO_ABAJO },
      ]}
    >
      <BarraChats
        texto={texto}
        seleccionando={activo}
        marcados={marcados.size}
        destinoRef={destinoRef}
        onVolver={() => conSalida(back)}
        onCancelarSeleccion={salir}
        // Chats sale con su animación y luego entra la búsqueda
        onBuscar={() => conSalida(openChatSearch)}
        onAbrirMenu={() => setMenu(true)}
        onEliminarMarcados={eliminarMarcados}
      />

      {siguiendo.length > 0 ? (
        <CarruselSeguidos ids={siguiendo} onEscribir={escribirA} />
      ) : null}

      <PildorasSegmentadas
        opciones={opciones}
        activo={filtro}
        onCambiar={setFiltro}
      />

      {status === "loading" ? (
        <EsqueletoChats isDark={isDark} />
      ) : visibleChats.length === 0 ? (
        chats.length === 0 ? (
          <IllustratedEmptyState
            icon={<BulkMessageIcon size={80} />}
            title={
              status === "error"
                ? "No pudimos cargar tus chats"
                : "Sin mensajes"
            }
            message={
              status === "error"
                ? "Revisa tu conexión e inténtalo de nuevo."
                : "Escribe a alguien desde un producto y tu chat aparecerá aquí."
            }
            style={estilos.vacio}
          />
        ) : (
          <IllustratedEmptyState
            icon={<BulkSearchIcon size={80} />}
            title={filtro !== "todos" ? "Sin resultados" : "Sin mensajes"}
            message="No hay chats con este filtro."
            style={estilos.vacio}
          />
        )
      ) : (
        <ListaChats
          chats={visibleChats}
          filtro={filtro}
          isDark={isDark}
          categoriaPorProducto={categoriaPorProducto}
          sinLeerPorChat={sinLeerPorChat}
          seleccionando={activo}
          marcados={marcados}
          registrar={registrar}
          onPress={alPulsar}
          onLongPress={iniciar}
          onEliminar={eliminarUno}
        />
      )}

      <MenuOpciones
        visible={menu}
        // La pestaña empieza bajo la barra de estado; el menú se mide desde arriba de la ventana
        top={insets.top + 8 + 56}
        onClose={() => setMenu(false)}
        opciones={[
          {
            etiqueta: "Seleccionar todo",
            icono: "checkbox-outline",
            deshabilitada: visibleChats.length === 0,
            onPress: () => iniciarTodos(visibleChats.map((c) => c.id)),
          },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1 },
  vacio: { paddingTop: 40 },
});
