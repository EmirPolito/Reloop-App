import type { ImageSource } from "expo-image";

/* -------------------------------------------------------------------------- */
/*  Stickers                                                                  */
/*  Coloca las 10 imágenes en assets/images/perfil/ con estos nombres         */
/*  (la ruta es relativa a este archivo: src/features/perfil -> ../../../assets). */
/* -------------------------------------------------------------------------- */

export interface StickerPerfil {
  id: string;
  source: ImageSource;
}

export const STICKERS_PERFIL: StickerPerfil[] = [
  {
    id: "sticker-1",
    source: require("../../../assets/images/perfil/1.png"),
  },
  {
    id: "sticker-2",
    source: require("../../../assets/images/perfil/2.png"),
  },
  {
    id: "sticker-3",
    source: require("../../../assets/images/perfil/3.png"),
  },
  {
    id: "sticker-4",
    source: require("../../../assets/images/perfil/4.png"),
  },
  {
    id: "sticker-5",
    source: require("../../../assets/images/perfil/5.png"),
  },
  {
    id: "sticker-6",
    source: require("../../../assets/images/perfil/6.png"),
  },
  {
    id: "sticker-7",
    source: require("../../../assets/images/perfil/7.png"),
  },
  {
    id: "sticker-8",
    source: require("../../../assets/images/perfil/8.png"),
  },
  {
    id: "sticker-9",
    source: require("../../../assets/images/perfil/9.png"),
  },
  {
    id: "sticker-10",
    source: require("../../../assets/images/perfil/10.png"),
  },
];

export function stickerPorId(id: string): StickerPerfil | undefined {
  return STICKERS_PERFIL.find((s) => s.id === id);
}
