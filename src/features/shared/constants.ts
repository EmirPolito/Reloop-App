import type { CategoryId } from "@/features/marketplace/types";
import type { SymbolViewProps } from "expo-symbols";

// ─── Iconos ──────────────────────────────────────────────────────────────────

export type IconName =
  | "sell"
  | "sync"
  | "favorite"
  | "gift"
  | "paw"
  | "restaurant"
  | "home"
  | "star"
  | "starFilled"
  | "add"
  | "chat"
  | "person"
  | "notifications"
  | "location"
  | "search"
  | "chevronDown"
  | "chevronRight"
  | "close"
  | "photo"
  | "send"
  | "back"
  | "attach"
  | "filter"
  | "flag";

export const ICONS = {
  sell: { ios: "tag.fill", android: "sell", web: "sell" },
  sync: { ios: "arrow.2.circlepath", android: "sync", web: "sync" },
  favorite: { ios: "heart.fill", android: "favorite", web: "favorite" },
  gift: { ios: "gift", android: "redeem", web: "redeem" },
  paw: { ios: "pawprint", android: "pets", web: "pets" },
  restaurant: { ios: "fork.knife", android: "restaurant", web: "restaurant" },
  home: { ios: "house", android: "home", web: "home" },
  star: { ios: "star", android: "star", web: "star" },
  starFilled: { ios: "star.fill", android: "star", web: "star" },
  add: { ios: "plus", android: "add", web: "add" },
  chat: {
    ios: "bubble.left",
    android: "chat_bubble_outline",
    web: "chat_bubble_outline",
  },
  person: { ios: "person", android: "person", web: "person" },
  notifications: {
    ios: "bell",
    android: "notifications_none",
    web: "notifications_none",
  },
  location: {
    ios: "mappin.and.ellipse",
    android: "location_on",
    web: "location_on",
  },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  chevronDown: {
    ios: "chevron.down",
    android: "keyboard_arrow_down",
    web: "keyboard_arrow_down",
  },
  chevronRight: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  close: { ios: "xmark", android: "close", web: "close" },
  photo: { ios: "camera", android: "photo_camera", web: "photo_camera" },
  send: { ios: "paperplane.fill", android: "send", web: "send" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  attach: { ios: "paperclip", android: "attach_file", web: "attach_file" },
  filter: { ios: "line.3.horizontal.decrease", android: "tune", web: "tune" },
  flag: { ios: "flag", android: "flag", web: "flag" },
} satisfies Record<IconName, SymbolViewProps["name"]>;

// ─── Categorías ──────────────────────────────────────────────────────────────

export const PRODUCT_ICONS: Record<CategoryId, IconName> = {
  venta: "sell",
  cambio: "sync",
  donacion: "gift",
  mascota: "paw",
  comida: "restaurant",
};

export const PRODUCT_COLORS: Record<CategoryId, [string, string]> = {
  venta: ["#7DC8FF", "#168DFF"],
  cambio: ["#84E0C0", "#1FAE85"],
  donacion: ["#FFBBD3", "#FF7FA9"],
  mascota: ["#FFE0A4", "#FFB52E"],
  comida: ["#FFC1B1", "#F58168"],
};

export const CATEGORY_IMAGES: Record<CategoryId, number> = {
  venta: require("@/assets/images/VENTAS.png"),
  cambio: require("@/assets/images/INTERCAMBIOS.png"),
  donacion: require("@/assets/images/DONACIONES.png"),
  mascota: require("@/assets/images/ADOPCIONES.png"),
  comida: require("@/assets/images/COMIDAS.png"),
};

/** Fondo general de la app (gris tipo Apple en claro); igual en todos los módulos */
export const APP_BACKGROUND = { light: "#f7f7f7ff", dark: "#101010" } as const;
