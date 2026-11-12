import { useCallback, useEffect, useState } from "react";

import { useNotify } from "@/features/notificaciones/hooks/useNotify";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { addComment, subscribeComments } from "../productRepository";
import type { Product, ProductComment } from "../types";
import type { FeedStatus } from "./useMarketplaceData";

const NO_COMMENTS: ProductComment[] = [];

interface Thread {
  productId: string;
  comments: ProductComment[];
  status: FeedStatus;
}

/**
 * Comentarios de una publicación en tiempo real, y la acción de escribir uno nuevo.
 * Con `product` (cuando ya cargó) se avisa a quien publicó de cada comentario.
 */
export function useProductComments(
  productId: string,
  product: Pick<Product, "ownerId" | "name"> | null = null,
) {
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const [thread, setThread] = useState<Thread | null>(null);
  const notify = useNotify();
  const ownerId = product?.ownerId;
  const productName = product?.name;

  useEffect(
    () =>
      subscribeComments(
        productId,
        (comments) => setThread({ productId, comments, status: "ready" }),
        (error) => {
          console.warn("No se pudo leer los comentarios.", describeFirestoreError(error));
          setThread({ productId, comments: NO_COMMENTS, status: "error" });
        },
      ),
    [productId],
  );

  const send = useCallback(
    async (text: string) => {
      await addComment(productId, { authorId: uid, author: profile.name, text });
      if (ownerId && productName) {
        notify(ownerId, { type: "comentario", productId, productName, text });
      }
    },
    [productId, uid, profile.name, ownerId, productName, notify],
  );

  // Si la publicación cambia, lo guardado es de la anterior y se ignora hasta que llegue lo nuevo
  const current = thread?.productId === productId ? thread : null;
  return {
    comments: current?.comments ?? NO_COMMENTS,
    status: current?.status ?? ("loading" as FeedStatus),
    addComment: send,
  };
}
