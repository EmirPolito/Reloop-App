import type { Chat, Product } from "@/features/marketplace/types";

/** Chats que coinciden con la búsqueda (contacto, producto o último mensaje), en el mismo orden. */
export function filterChats(
  chats: Chat[],
  products: Product[],
  search: string,
): Chat[] {
  const term = search.trim().toLocaleLowerCase();
  if (!term) return chats;
  return chats.filter((chat) => {
    const productName =
      products.find((product) => product.id === chat.productId)?.name ?? "";
    return `${chat.name} ${productName} ${chat.lastMessage?.text ?? ""}`
      .toLocaleLowerCase()
      .includes(term);
  });
}
