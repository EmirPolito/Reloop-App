import { Ionicons } from "@expo/vector-icons";
import { IconoEliminarLinea } from "@/features/perfil/Perfiliconos";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotonBarra } from "@/components/ui/BotonBarra";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { SwipeParaEliminar } from "@/components/ui/SwipeParaEliminar";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { FondoHome } from "@/features/home/components/FondoHome";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { useChatActions, useChats } from "./ChatProvider";
import { filterChats } from "./chatSelectors";
import { BulkMessageIcon, BulkSearchIcon } from "./components/ChatIcons";
import { ChatListItem } from "./components/ChatListItem";
import { useMensajesSinLeer } from "./hooks/useMensajesSinLeer";
import { BackArrowIcon } from "./components/ThreadIcons";

/** Todos, los que tienen mensajes sin leer o los que hablan de una publicación */
type Filtro = "todos" | "sinLeer" | "publicaciones";

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
/** Mismo círculo que los botones de Notificaciones y Favoritos */

/**
 * Lista de chats, con el mismo aspecto que Notificaciones y Favoritos: el fondo del inicio,
 * el título al centro con volver y campana, un buscador blanco (con "@" busca por persona),
 * píldoras de filtro y una tarjeta por conversación.
 */
export function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { chats: todos, status } = useChats();
  const { deleteChats } = useChatActions();
  // Los chats que la persona eliminó no se listan (si escriben de nuevo, reaparecen)
  const chats = useMemo(() => todos.filter((chat) => !chat.hidden), [todos]);
  const seleccion = useSeleccion();
  const [menu, setMenu] = useState(false);
  const { mostrar } = useAvisos();
  // Hacia el botón de eliminar vuelan los chats (efecto Stream)
  const { destinoRef, registrar, eliminarConEfecto } = useEliminarConEfecto();
  const { back, openThread } = useAppNavigation();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const productIds = useMemo(
    () => chats.flatMap((chat) => (chat.productId ? [chat.productId] : [])),
    [chats],
  );
  const { products } = useProductsByIds(productIds);
  const sinLeerPorChat = useMensajesSinLeer(chats);

  // Con "@" al inicio se busca por persona (su usuario o su nombre)
  const modoBusqueda = modoDeBusqueda(busqueda);
  const buscaPersonas = modoBusqueda.modo === "usuarios";
  const contactos = useMemo(
    () => [...new Set(chats.map((chat) => chat.otherId))],
    [chats],
  );
  const perfiles = usePerfilDe.varias(contactos);

  const sinLeer = chats.filter((chat) => chat.unread).length;
  const opciones: { id: Filtro; texto: string }[] = [
    { id: "todos", texto: "Todos" },
    {
      id: "sinLeer",
      texto: sinLeer > 0 ? `Sin leer · ${sinLeer}` : "Sin leer",
    },
    { id: "publicaciones", texto: "Publicaciones" },
  ];

  const visibleChats = useMemo(() => {
    const porFiltro = chats.filter((chat) =>
      filtro === "sinLeer"
        ? chat.unread
        : filtro === "publicaciones"
          ? Boolean(chat.productId)
          : true,
    );
    if (!buscaPersonas) return filterChats(porFiltro, products, busqueda);
    const termino = modoBusqueda.termino;
    return porFiltro.filter(
      (chat) =>
        !termino ||
        (perfiles.get(chat.otherId)?.username ?? "").includes(termino) ||
        normalizarNombre(chat.name).includes(termino),
    );
  }, [
    chats,
    filtro,
    products,
    busqueda,
    buscaPersonas,
    modoBusqueda.termino,
    perfiles,
  ]);

  const texto = isDark ? "#F1F5F9" : "#101010";
  const hayFiltro = filtro !== "todos" || busqueda.trim() !== "";

  const { activo, marcados } = seleccion;
  const alPulsar = useCallback(
    (chatId: string) =>
      activo ? seleccion.alternar(chatId) : openThread(chatId),
    [activo, seleccion, openThread],
  );

  const avisarEliminados = (cantidad: number) =>
    mostrar({
      tipo: "eliminada",
      titulo:
        cantidad === 1 ? "Chat eliminado" : `${cantidad} chats eliminados`,
      descripcion: "Se eliminaron solo para ti.",
    });

  /** Deslizar un chat a la izquierda lo elimina (si falla, el chat vuelve) */
  const eliminarUno = (id: string) =>
    deleteChats([id]).then(
      () => avisarEliminados(1),
      (error) => {
        showErrorAlert("No se pudo eliminar el chat", error);
        throw error;
      },
    );

  const eliminar = () => {
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
            eliminarConEfecto(ids, () => deleteChats(ids))
              .then(() => {
                seleccion.salir();
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
    <View style={styles.pantalla}>
      {/* El mismo fondo que Notificaciones y Favoritos */}
      <FondoHome intensidad={0.7} />

      {/* Volver a la izquierda, el título al centro y la campana a la derecha */}
      <View style={styles.barra}>
        {activo ? (
          <BotonBarra etiqueta="Cancelar selección" onPress={seleccion.salir}>
            <Ionicons name="close" size={26} color={texto} />
          </BotonBarra>
        ) : (
          <BotonBarra etiqueta="Volver" onPress={back}>
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={28} color={texto} />
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
              ? "Selecciona chats"
              : `${marcados.size} seleccionado${marcados.size === 1 ? "" : "s"}`
            : "Chats"}
        </Text>
        <View style={styles.acciones}>
          {activo ? (
            // Destino del efecto: hacia aquí vuelan los chats eliminados
            <View ref={destinoRef} collapsable={false}>
              <BotonBarra
                etiqueta="Eliminar chats seleccionados"
                peligro
                disabled={marcados.size === 0}
                onPress={eliminar}
              >
                <IconoEliminarLinea size={26} color={"#FFFFFF"} />
              </BotonBarra>
            </View>
          ) : (
            <BotonBarra
              etiqueta="Eliminar chats"
              disabled={chats.length === 0}
              onPress={() => setMenu(true)}
            >
              <IconoEliminarLinea size={26} color={"#FF8A1F"} />
            </BotonBarra>
          )}
        </View>
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar chats o @usuario"
        accessibilityLabel="Buscar conversaciones"
        personas={buscaPersonas}
      />

      <FiltrosPildoras
        opciones={opciones}
        activo={filtro}
        onCambiar={setFiltro}
      />

      {status === "loading" ? (
        <LoadingState />
      ) : (
        <Animated.View
          key={filtro}
          entering={CAMBIO_FILTRO}
          style={styles.lista}
        >
          <FlatList
            data={visibleChats}
            extraData={marcados}
            keyExtractor={(chat) => chat.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              // Más ancha que otras listas: los chats abarcan más de lado a lado
              paddingHorizontal: 6,
              paddingTop: 12,
              // Espacio para que la barra de navegación no tape el último chat
              paddingBottom: insets.bottom + 110,
            }}
            renderItem={({ item }) => (
              <SwipeParaEliminar
                disabled={activo}
                onDelete={() => eliminarUno(item.id)}
              >
                <ChatListItem
                  chat={item}
                  categoria={
                    products.find((product) => product.id === item.productId)
                      ?.category
                  }
                  sinLeer={item.unread ? (sinLeerPorChat[item.id] ?? 1) : 0}
                  onPress={alPulsar}
                  onLongPress={seleccion.iniciar}
                  seleccionando={activo}
                  marcado={marcados.has(item.id)}
                  registrar={registrar}
                />
              </SwipeParaEliminar>
            )}
            ListEmptyComponent={
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
                  style={styles.vacio}
                />
              ) : (
                <IllustratedEmptyState
                  icon={<BulkSearchIcon size={80} />}
                  title={hayFiltro ? "Sin resultados" : "Sin mensajes"}
                  message="No encontramos nada relacionado con tu búsqueda."
                  style={styles.vacio}
                />
              )
            }
          />
        </Animated.View>
      )}

      <MenuOpciones
        visible={menu}
        top={8 + 56}
        onClose={() => setMenu(false)}
        opciones={[
          {
            etiqueta: "Seleccionar",
            icono: "checkmark-circle-outline",
            onPress: () => seleccion.iniciar(),
          },
          {
            etiqueta: "Seleccionar todo",
            icono: "checkbox-outline",
            onPress: () =>
              seleccion.iniciarTodos(visibleChats.map((c) => c.id)),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingTop: 8 },
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
  // Un poco más cerca de las píldoras que en otras pantallas
  lista: { flex: 1, marginTop: -10 },
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
