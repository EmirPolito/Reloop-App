import { useCallback, useRef } from "react";

import type { Product } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useNotify } from "@/features/notificaciones/hooks/useNotify";
import { useProfile } from "@/features/perfil/ProfileProvider";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { openChat, type ChatParty } from "../chatRepository";

/**
 * Abre la conversación con otra persona: reutiliza el chat existente o crea uno nuevo
 * (con mensaje de interés si viene un producto) y navega a él.
 */
export function useOpenChat() {
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const { openThread } = useAppNavigation();
  const opening = useRef(false);
  const notify = useNotify();

  return useCallback(
    async (
      other: ChatParty,
      product: Pick<Product, "id" | "name"> | null = null,
    ) => {
      if (other.id === uid) {
        showAlert(
          "Es tu publicación",
          "Quienes se interesen en ella te escribirán y verás sus mensajes en tus chats.",
        );
        return;
      }
      // Un segundo toque mientras se abre no debe apilar otra pantalla
      if (opening.current) return;
      opening.current = true;
      try {
        const { chatId, intro } = await openChat({
          me: { id: uid, name: profile.name },
          other,
          product,
        });
        if (intro) notify(other.id, { type: "mensaje", chatId, text: intro });
        openThread(chatId);
      } catch (error) {
        showErrorAlert("No se pudo abrir el chat", error);
      } finally {
        opening.current = false;
      }
    },
    [uid, profile.name, openThread, notify],
  );
}
