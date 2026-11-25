import { useCallback, useState } from "react";

import { useChatActions } from "@/features/chats/ProveedorChats";
import { openChat } from "@/features/chats/repositorioChats";
import type { Product } from "@/features/marketplace/types";
import { useProfile } from "@/features/perfil/ProveedorPerfil";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { showErrorAlert } from "@/utils/alerts";
import { totalDe, type ItemPedido, type MetodoPago } from "./formatoPedido";

/**
 * Manda el pedido al chat con el vendedor (lo abre o lo crea, ligado a la publicación y sin el
 * mensaje de interés). `mandar` devuelve el id del chat si se mandó (`null` si no): quien
 * llama lleva a la conversación cuando termina la ola de "Enviar".
 */
export function useMandarPedido() {
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const { sendOrder } = useChatActions();
  const [enviando, setEnviando] = useState(false);

  const mandar = useCallback(
    async (
      producto: Product,
      items: ItemPedido[],
      metodo: MetodoPago,
      nota: string,
    ): Promise<string | null> => {
      setEnviando(true);
      try {
        const { chatId } = await openChat({
          me: { id: uid, name: profile.name },
          other: { id: producto.ownerId, name: producto.seller },
          product: producto,
          withIntro: false,
        });
        await sendOrder(chatId, producto.ownerId, {
          productoId: producto.id,
          producto: producto.name,
          items,
          total: totalDe(items),
          metodo,
          nota,
        });
        setEnviando(false);
        return chatId;
      } catch (error) {
        showErrorAlert("No se pudo mandar el pedido", error);
        setEnviando(false);
        return null;
      }
    },
    [uid, profile.name, sendOrder],
  );

  return { mandar, enviando };
}
