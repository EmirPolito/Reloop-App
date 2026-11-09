import { useMemo, useState } from "react";
import { View } from "react-native";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { TabScreenLayout } from "@/components/ui/TabScreenLayout";
import { useProductsByIds } from "@/features/marketplace/hooks/useProductsByIds";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useChats } from "./ChatProvider";
import { filterChats } from "./chatSelectors";
import { BulkMessageIcon, BulkSearchIcon } from "./components/ChatIcons";
import { ChatListItem } from "./components/ChatListItem";
import { ChatSearchBar } from "./components/ChatSearchBar";

const EMPTY_STATE_SPACING = { paddingVertical: 120 } as const;

export function ChatsScreen() {
  const { chats, status } = useChats();
  const { openThread } = useAppNavigation();
  const [search, setSearch] = useState("");

  const productIds = useMemo(
    () => chats.flatMap((chat) => (chat.productId ? [chat.productId] : [])),
    [chats],
  );
  const { products } = useProductsByIds(productIds);

  const visibleChats = useMemo(
    () => filterChats(chats, products, search),
    [chats, products, search],
  );

  return (
    <TabScreenLayout title="Chats" titleColor="#111111">
      <ChatSearchBar value={search} onChangeText={setSearch} />

      {status === "loading" ? (
        <LoadingState />
      ) : chats.length === 0 ? (
        <IllustratedEmptyState
          icon={<BulkMessageIcon size={80} />}
          title={
            status === "error" ? "No pudimos cargar tus chats" : "Sin mensajes"
          }
          message={
            status === "error"
              ? "Revisa tu conexión e inténtalo de nuevo."
              : "Escribe a alguien desde un producto y tu chat aparecerá aquí."
          }
          style={EMPTY_STATE_SPACING}
        />
      ) : visibleChats.length === 0 ? (
        <IllustratedEmptyState
          icon={<BulkSearchIcon size={80} />}
          title="Sin resultados"
          message="No encontramos nada relacionado con tu búsqueda."
          style={EMPTY_STATE_SPACING}
        />
      ) : (
        <View style={{ gap: 4 }}>
          {visibleChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              productName={
                products.find((product) => product.id === chat.productId)?.name
              }
              onPress={openThread}
            />
          ))}
        </View>
      )}
    </TabScreenLayout>
  );
}
