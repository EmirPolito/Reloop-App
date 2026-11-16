import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { NotificationBellButton } from "@/components/ui/NotificationBellButton";
import { modoDeBusqueda } from "@/features/busqueda/modoBusqueda";
import { FondoHome } from "@/features/home/components/FondoHome";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { normalizarNombre } from "@/features/perfil/username";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useChats } from "./ChatProvider";
import { filterChats } from "./chatSelectors";
import { BulkMessageIcon, BulkSearchIcon } from "./components/ChatIcons";
import { ChatListItem } from "./components/ChatListItem";
import { BackArrowIcon } from "./components/ThreadIcons";

/** Todos, los que tienen mensajes sin leer o los que hablan de una publicación */
type Filtro = "todos" | "sinLeer" | "publicaciones";

/** Al cambiar de filtro la lista aparece con un fundido corto */
const CAMBIO_FILTRO = FadeIn.duration(200);
/** Mismo círculo que los botones de Notificaciones y Favoritos */
const LADO_BOTON = 48;

/**
 * Lista de chats, con el mismo aspecto que Notificaciones y Favoritos: el fondo del inicio,
 * el título al centro con volver y campana, un buscador blanco (con "@" busca por persona),
 * píldoras de filtro y una tarjeta por conversación.
 */
export function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { chats, status } = useChats();
  const { back, openThread } = useAppNavigation();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");

  const productIds = useMemo(
    () => chats.flatMap((chat) => (chat.productId ? [chat.productId] : [])),
    [chats],
  );
  const { products } = useProductsByIds(productIds);

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
    { id: "sinLeer", texto: sinLeer > 0 ? `Sin leer · ${sinLeer}` : "Sin leer" },
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
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: isDark ? "#ffffff33" : "#ffffff",
  };
  const hayFiltro = filtro !== "todos" || busqueda.trim() !== "";

  return (
    <View style={styles.pantalla}>
      {/* El mismo fondo que Notificaciones y Favoritos */}
      <FondoHome intensidad={0.7} />

      {/* Volver a la izquierda, el título al centro y la campana a la derecha */}
      <View style={styles.barra}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={texto} />
          </View>
        </PressableScale>
        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          Chats
        </Text>
        <NotificationBellButton lado={LADO_BOTON} />
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar chats o @usuario"
        accessibilityLabel="Buscar conversaciones"
        personas={buscaPersonas}
      />

      <FiltrosPildoras opciones={opciones} activo={filtro} onCambiar={setFiltro} />

      {status === "loading" ? (
        <LoadingState />
      ) : (
        <Animated.View key={filtro} entering={CAMBIO_FILTRO} style={styles.lista}>
          <FlatList
            data={visibleChats}
            keyExtractor={(chat) => chat.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 15,
              paddingTop: 12,
              // Espacio para que la barra de navegación no tape el último chat
              paddingBottom: insets.bottom + 110,
            }}
            renderItem={({ item }) => (
              <ChatListItem
                chat={item}
                productName={
                  products.find((product) => product.id === item.productId)
                    ?.name
                }
                onPress={openThread}
              />
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
  botonBarra: {
    width: LADO_BOTON,
    height: LADO_BOTON,
    borderRadius: LADO_BOTON / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
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
  vacio: { paddingTop: 110, paddingBottom: 140 },
});
