import { IconoEliminarLinea } from "@/features/perfil/Perfiliconos";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { DeslizarConBoton } from "@/components/ui/DeslizarConBoton";
import { useEliminarConEfecto } from "@/components/ui/Disolvible";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { coloresCristal } from "@/features/busqueda/components/PildoraCristal";
import { MenuOpciones } from "@/components/ui/MenuOpciones";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSiguiendo } from "@/features/perfil/hooks/useSiguiendo";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useSeleccion } from "@/hooks/useSeleccion";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { useChatActions, useChats } from "./ChatProvider";
import { CarruselSeguidos } from "./components/CarruselSeguidos";
import { BulkMessageIcon, BulkSearchIcon } from "./components/ChatIcons";
import { ChatListItem } from "./components/ChatListItem";
import { PildorasSegmentadas } from "./components/PildorasSegmentadas";
import { BackArrowIcon } from "./components/ThreadIcons";
import { useMensajesSinLeer } from "./hooks/useMensajesSinLeer";
import { useOpenChat } from "./hooks/useOpenChat";
import {
  fondoCristalSuave,
  sombraCristalSuave,
} from "@/components/ui/cristalSuave";

/** Todos, los que tienen mensajes sin leer o los que hablan de una publicación */
type Filtro = "todos" | "sinLeer" | "publicaciones";

/** Al eliminar varios, cuántos hacen el efecto de volar al bote */
const MAX_ANIMADOS = 3;
/** Esquinas de la tarjeta de los chats */
const RADIO_TARJETA = 26;
/**
 * Espacio bajo la tarjeta (sobre el área segura de abajo): termina por encima de la barra de
 * navegación, que mide 60 y flota unos px sobre el borde, con aire entre las dos
 */
const ESPACIO_ABAJO = 76;

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);

/**
 * Lista de chats: volver, el título al centro, buscar (abre su propia pantalla) y eliminar;
 * debajo, las personas que sigo en un carrusel, las píldoras de filtro y todas las
 * conversaciones dentro de una tarjeta grande, separadas por una línea. Lo de arriba no se
 * mueve: solo se desplazan los chats, dentro de la tarjeta, con su barra a la derecha.
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
  const { back, openThread, openChatSearch } = useAppNavigation();
  const openChat = useOpenChat();
  const siguiendo = useSiguiendo();
  // Estable: así el carrusel no se re-renderiza con la pantalla (eso lo hacía temblar)
  const escribirA = useCallback(
    (id: string, name: string) => void openChat({ id, name }),
    [openChat],
  );
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const productIds = useMemo(
    () => chats.flatMap((chat) => (chat.productId ? [chat.productId] : [])),
    [chats],
  );
  const { products } = useProductsByIds(productIds);
  const sinLeerPorChat = useMensajesSinLeer(chats);

  const sinLeer = chats.filter((chat) => chat.unread).length;
  const opciones: { id: Filtro; texto: string }[] = [
    { id: "todos", texto: "Todos" },
    {
      id: "sinLeer",
      texto: sinLeer > 0 ? `Sin leer · ${sinLeer}` : "Sin leer",
    },
    { id: "publicaciones", texto: "Publicaciones" },
  ];

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
  const hayFiltro = filtro !== "todos";
  // El mismo cristal que los botones de arriba (fondo translúcido, desenfoque y borde de luz)
  const cristal = coloresCristal(isDark);

  const { activo, marcados } = seleccion;
  const alPulsar = useCallback(
    (chatId: string) =>
      activo
        ? seleccion.alternar(chatId)
        : // Chats sale con la animación corta y luego entra la conversación
          conSalida(() => openThread(chatId), true),
    [activo, seleccion, openThread],
  );

  const avisarEliminados = (cantidad: number) =>
    mostrar({
      tipo: "eliminada",
      titulo:
        cantidad === 1 ? "Chat eliminado" : `${cantidad} chats eliminados`,
      descripcion: "Se eliminaron solo para ti.",
    });

  /** Deslizar un chat a la izquierda deja ver Eliminar; al tocarlo se elimina (si falla, vuelve) */
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
            // Solo los primeros vuelan al bote: con muchos a la vez el efecto se trababa
            eliminarConEfecto(ids, () => deleteChats(ids), MAX_ANIMADOS)
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
    <View
      style={[
        styles.pantalla,
        { paddingBottom: insets.bottom + ESPACIO_ABAJO },
      ]}
    >
      {/* Volver a la izquierda, el título al centro; buscar y eliminar a la derecha */}
      <View style={styles.barra}>
        {activo ? (
          <BotonBarra etiqueta="Cancelar selección" onPress={seleccion.salir}>
            <Ionicons name="close" size={26} color={texto} />
          </BotonBarra>
        ) : (
          <BotonBarra etiqueta="Volver" onPress={() => conSalida(back)}>
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
                // Con algo elegido: fondo rojo e icono blanco (igual en oscuro)
                peligro={marcados.size > 0}
                colorPeligro="#EF4444"
                // Sin nada elegido se ve blanco (no apagado) y no hace nada
                onPress={eliminar}
              >
                <IconoEliminarLinea
                  size={26}
                  color={marcados.size > 0 ? "#FFFFFF" : texto}
                />
              </BotonBarra>
            </View>
          ) : (
            <>
              <BotonBarra
                etiqueta="Buscar chats"
                // Chats sale con la animación corta y luego entra la búsqueda
                onPress={() => conSalida(openChatSearch, true)}
              >
                <IconoBusqueda size={24} color={texto} grosorExtra={0.5} />
              </BotonBarra>
              {/* Siempre blanco, haya o no chats (sin chats, la opción del menú se apaga) */}
              <BotonBarra
                etiqueta="Eliminar chats"
                onPress={() => setMenu(true)}
              >
                <IconoEliminarLinea size={26} color={texto} />
              </BotonBarra>
            </>
          )}
        </View>
      </View>

      {siguiendo.length > 0 ? (
        <CarruselSeguidos ids={siguiendo} onEscribir={escribirA} />
      ) : null}

      <PildorasSegmentadas
        opciones={opciones}
        activo={filtro}
        onCambiar={setFiltro}
      />

      {status === "loading" ? (
        <LoadingState />
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
            style={styles.vacio}
          />
        ) : (
          <IllustratedEmptyState
            icon={<BulkSearchIcon size={80} />}
            title={hayFiltro ? "Sin resultados" : "Sin mensajes"}
            message="No hay chats con este filtro."
            style={styles.vacio}
          />
        )
      ) : (
        // La tarjeta crece con los chats hasta el espacio que queda sobre la barra de
        // navegación; si no caben, se desplazan dentro
        <View style={styles.areaLista}>
          {/* La sombra va por fuera: el recorte de las esquinas la cortaría */}
          <View style={styles.tarjetaSombra}>
            <View
              style={[
                styles.tarjeta,
                {
                  backgroundColor: fondoCristalSuave(isDark),
                  borderColor: cristal.borde,
                },
              ]}
            >
              {/* Sin desenfoque: detrás solo hay el fondo liso, y animar la opacidad de la
                  pantalla con un desenfoque tan grande hacía pesada la transición */}
              <FlatList
                // También redondeada: en Android el recorte de la tarjeta no siempre alcanza a la lista
                style={styles.lista}
                data={visibleChats}
                extraData={marcados}
                // Con otro filtro las filas se montan de nuevo y aparecen con el fundido
                keyExtractor={(chat) => `${filtro}:${chat.id}`}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                renderItem={({ item, index }) => (
                  <Animated.View entering={CAMBIO_FILTRO}>
                    <DeslizarConBoton
                      disabled={activo}
                      // El rojo respeta las esquinas redondas de la tarjeta
                      radioArriba={index === 0 ? RADIO_TARJETA : 0}
                      radioAbajo={
                        index === visibleChats.length - 1 ? RADIO_TARJETA : 0
                      }
                      onDelete={() => eliminarUno(item.id)}
                    >
                      <ChatListItem
                        chat={item}
                        categoria={
                          products.find(
                            (product) => product.id === item.productId,
                          )?.category
                        }
                        sinLeer={
                          item.unread ? (sinLeerPorChat[item.id] ?? 1) : 0
                        }
                        onPress={alPulsar}
                        onLongPress={seleccion.iniciar}
                        seleccionando={activo}
                        marcado={marcados.has(item.id)}
                        registrar={registrar}
                        ultimo={index === visibleChats.length - 1}
                      />
                    </DeslizarConBoton>
                  </Animated.View>
                )}
              />
            </View>
          </View>
        </View>
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
            onPress: () =>
              seleccion.iniciarTodos(visibleChats.map((c) => c.id)),
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
  // Más abajo de las píldoras; sin crecer de más: abraza los chats hasta el espacio que queda
  // Misma sombra que los botones de arriba: sin ella el cristal casi no se distingue del fondo
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
  areaLista: { flex: 1 },
  vacio: { paddingTop: 40 },
});
