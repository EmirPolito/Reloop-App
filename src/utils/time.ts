/** Hora de un mensaje, p. ej. "3:05 p. m.". */
export function formatMessageTime(time: number): string {
  return new Date(time).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Hora de hoy, "Ayer" o fecha corta, para la lista de chats. */
export function formatChatTime(time: number): string {
  const date = new Date(time);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return formatMessageTime(time);
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return date.toDateString() === yesterday.toDateString()
    ? "Ayer"
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
}
