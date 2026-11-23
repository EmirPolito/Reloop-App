import { usePathname } from "expo-router";
import { useEffect, useState } from "react";

import { useIntroTerminada } from "@/features/intro/efecto-entrada";
import { useAbrirNotificacion } from "../hooks/useAbrirNotificacion";
import {
  useNotificationActions,
  useNotificationArrival,
  useNotifications,
} from "../ProveedorNotificaciones";
import type { AppNotification } from "../tipos";
import { BannerNotificacion } from "./BannerNotificacion";

const RUTA_CHAT = "/chat/";
const RUTA_NOTIFICACIONES = "/notificaciones";

/** Al entrar a la app se anuncian como máximo tantas no leídas, una por una */
const MAX_AL_ENTRAR = 4;
/** Espera tras terminar la animación de entrada antes de mostrar la primera */
const ESPERA_INICIAL_MS = 900;
/** Espera entre un banner y el siguiente: que no salgan atropellados */
const PAUSA_ENTRE_MS = 1600;

/**
 * Decide cuándo se muestra el banner. Va en el layout de la app, encima de todas las
 * pantallas. No se anuncia lo que ya se está viendo: un mensaje del chat abierto se marca
 * como leído sin banner, y en la pantalla de notificaciones la lista ya se actualiza sola.
 *
 * Al entrar a la app con notificaciones sin leer, se anuncian una por una (con una pausa
 * entre cada una). Entrar al módulo de notificaciones cancela las que faltaban.
 */
export function ContenedorBanners() {
  const arrival = useNotificationArrival();
  const { notifications, status } = useNotifications();
  const { markRead, clearArrival } = useNotificationActions();
  const openNotification = useAbrirNotificacion();
  const pathname = usePathname();
  const introTerminada = useIntroTerminada();

  // Las no leídas con las que se entró a la app, en espera de anunciarse. `null`: aún no se
  // han tomado (se toman una sola vez por sesión)
  const [cola, setCola] = useState<AppNotification[] | null>(null);
  const [enPausa, setEnPausa] = useState(true);

  const openChatId = pathname.startsWith(RUTA_CHAT)
    ? decodeURIComponent(pathname.slice(RUTA_CHAT.length))
    : null;
  const enNotificaciones = pathname === RUTA_NOTIFICACIONES;
  const yaALaVista =
    arrival !== null &&
    (enNotificaciones ||
      (arrival.type === "mensaje" && arrival.chatId === openChatId));

  useEffect(() => {
    if (yaALaVista) clearArrival();
  }, [yaALaVista, clearArrival]);

  // Una sola vez por sesión, ya con la animación de entrada terminada y las notificaciones
  // cargadas, se toman las no leídas más recientes (si ya se está en el módulo, ninguna).
  // Se ajusta durante el render, como en el resto de la app, en lugar de en un efecto.
  if (cola === null && introTerminada && status === "ready") {
    setCola(
      enNotificaciones
        ? []
        : notifications.filter((item) => !item.read).slice(0, MAX_AL_ENTRAR),
    );
  }
  // Entrar al módulo de notificaciones descarta lo que faltaba por anunciar
  if (enNotificaciones && cola !== null && cola.length > 0) setCola([]);

  // Tras tomar la cola se espera un momento antes del primer banner
  const colaTomada = cola !== null;
  useEffect(() => {
    if (!colaTomada) return;
    const espera = setTimeout(() => setEnPausa(false), ESPERA_INICIAL_MS);
    return () => clearTimeout(espera);
  }, [colaTomada]);

  // Con el chat abierto, sus mensajes ya se están leyendo
  useEffect(() => {
    if (!openChatId) return;
    for (const item of notifications) {
      if (!item.read && item.type === "mensaje" && item.chatId === openChatId) {
        markRead(item.id);
      }
    }
  }, [openChatId, notifications, markRead]);

  /** Siguiente de la cola, sin las que ya se leyeron o cuyo chat está abierto */
  const siguiente = (cola ?? []).find((item) => {
    const vigente = notifications.find((n) => n.id === item.id);
    if (vigente?.read) return false;
    return !(item.type === "mensaje" && item.chatId === openChatId);
  });

  /** Retira el banner de la cola y deja pasar un momento antes del siguiente */
  const terminarDeLaCola = (item: AppNotification) => {
    setCola((actual) => (actual ?? []).filter((otra) => otra.id !== item.id));
    setEnPausa(true);
    setTimeout(() => setEnPausa(false), PAUSA_ENTRE_MS);
  };

  // Lo que acaba de llegar va primero; después, la cola de la entrada
  const mostrar =
    arrival && !yaALaVista
      ? { notificacion: arrival, deLaCola: false }
      : siguiente && !enPausa && !enNotificaciones && !arrival
        ? { notificacion: siguiente, deLaCola: true }
        : null;

  if (!mostrar) return null;
  const { notificacion, deLaCola } = mostrar;

  return (
    <BannerNotificacion
      // Una notificación renovada (otro mensaje de la misma persona) vuelve a anunciarse
      key={`${notificacion.id}:${notificacion.createdAt}`}
      notification={notificacion}
      onOpen={() => {
        // Abrirla es actuar: no se siguen anunciando las demás
        if (deLaCola) setCola([]);
        openNotification(notificacion);
      }}
      onDismiss={() => {
        if (deLaCola) terminarDeLaCola(notificacion);
        else clearArrival();
      }}
    />
  );
}
