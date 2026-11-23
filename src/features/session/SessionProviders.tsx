import type { PropsWithChildren } from "react";

import type { SessionUser } from "@/features/auth/AuthProvider";
import { AvisosProvider } from "@/features/avisos/AvisosProvider";
import { ChatProvider } from "@/features/chats/ProveedorChats";
import { MarketplaceProvider } from "@/features/marketplace/MarketplaceProvider";
import { NotificationsProvider } from "@/features/notificaciones/ProveedorNotificaciones";
import { ProfileProvider } from "@/features/perfil/ProveedorPerfil";
import { DraftsProvider } from "@/features/shared/DraftsProvider";
import { SessionUserProvider } from "./SessionUserProvider";

/**
 * Estado de una sesión iniciada. El layout `(app)` lo monta con el uid como `key`:
 * al cerrar sesión se descarta entero (y con él todas las suscripciones a Firestore),
 * así una cuenta nunca ve datos de otra. Todos los proveedores leen de Firestore con
 * el uid de `SessionUserProvider`, así que su orden entre sí no importa.
 */
export function SessionProviders({
  user,
  children,
}: PropsWithChildren<{ user: SessionUser }>) {
  return (
    <SessionUserProvider user={user}>
      <ProfileProvider>
        <MarketplaceProvider>
          <ChatProvider>
            <NotificationsProvider>
              <DraftsProvider>
                <AvisosProvider>{children}</AvisosProvider>
              </DraftsProvider>
            </NotificationsProvider>
          </ChatProvider>
        </MarketplaceProvider>
      </ProfileProvider>
    </SessionUserProvider>
  );
}
