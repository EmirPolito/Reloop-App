import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import { describeFirestoreError } from "@/lib/firestoreValues";
import {
  markNotificationRead,
  markNotificationsRead,
  subscribeNotifications,
} from "./notificationRepository";
import type { AppNotification } from "./types";

interface NotificationsState {
  /** De la más reciente a la más antigua. */
  notifications: AppNotification[];
  unreadCount: number;
  status: "loading" | "ready" | "error";
}

interface NotificationActions {
  /** Marca una como leída; si falla solo se registra (no bloquea la navegación). */
  markRead: (notificationId: string) => void;
  markAllRead: () => Promise<void>;
  /** Retira el banner de la notificación que acaba de llegar. */
  clearArrival: () => void;
}

const LOADING: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  status: "loading",
};

const NotificationsContext = createContext<NotificationsState | null>(null);
const NotificationActionsContext = createContext<NotificationActions | null>(
  null,
);
// `undefined` distingue "sin proveedor" de "sin notificación recién llegada" (null)
const NotificationArrivalContext = createContext<
  AppNotification | null | undefined
>(undefined);

/**
 * Las notificaciones de la persona, en tiempo real. La lista, las acciones y la recién
 * llegada van en contextos separados: la campana solo se renderiza cuando cambia el
 * contador y el banner solo cuando llega una nueva.
 */
export function NotificationsProvider({ children }: PropsWithChildren) {
  const { uid } = useSessionUser();
  const [state, setState] = useState<NotificationsState>(LOADING);
  const [arrival, setArrival] = useState<AppNotification | null>(null);
  const notificationsRef = useLatestRef(state.notifications);

  useEffect(
    () =>
      subscribeNotifications(
        uid,
        (notifications, arrivals) => {
          setState({
            notifications,
            unreadCount: notifications.filter((item) => !item.read).length,
            status: "ready",
          });
          // Si llegan varias a la vez se anuncia la más reciente
          if (arrivals.length > 0) setArrival(arrivals[0]);
        },
        (error) => {
          console.warn(
            "No se pudo leer las notificaciones.",
            describeFirestoreError(error),
          );
          setState((current) => ({ ...current, status: "error" }));
        },
      ),
    [uid],
  );

  const actions = useMemo<NotificationActions>(
    () => ({
      markRead: (notificationId) => {
        markNotificationRead(uid, notificationId).catch((error) =>
          console.warn(
            "No se pudo marcar la notificación como leída.",
            describeFirestoreError(error),
          ),
        );
      },
      markAllRead: () =>
        markNotificationsRead(
          uid,
          notificationsRef.current
            .filter((item) => !item.read)
            .map((item) => item.id),
        ),
      clearArrival: () => setArrival(null),
    }),
    [uid, notificationsRef],
  );

  return (
    <NotificationsContext.Provider value={state}>
      <NotificationActionsContext.Provider value={actions}>
        <NotificationArrivalContext.Provider value={arrival}>
          {children}
        </NotificationArrivalContext.Provider>
      </NotificationActionsContext.Provider>
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsState {
  return useRequiredContext(NotificationsContext, "NotificationsProvider");
}

export function useNotificationActions(): NotificationActions {
  return useRequiredContext(NotificationActionsContext, "NotificationsProvider");
}

/** La notificación que acaba de llegar y aún no se ha anunciado ni descartado. */
export function useNotificationArrival(): AppNotification | null {
  const arrival = useContext(NotificationArrivalContext);
  if (arrival === undefined) {
    throw new Error("Este hook debe usarse dentro de <NotificationsProvider>.");
  }
  return arrival;
}
