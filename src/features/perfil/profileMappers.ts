import type { DocumentData } from "firebase/firestore";

import {
  COLORES_PERFIL,
  MAX_NOMBRE,
  type ColorPerfil,
  type DatosPerfil,
  type PildoraPerfilData,
} from "./Perfiltemas";

export function defaultProfile(name: string): DatosPerfil {
  return {
    photo: null,
    name: name.slice(0, MAX_NOMBRE),
    description: "",
    color: "azul",
    pills: [],
    stickers: [],
  };
}

function isColor(value: unknown): value is ColorPerfil {
  return COLORES_PERFIL.includes(value as ColorPerfil);
}

function mapPills(value: unknown): PildoraPerfilData[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PildoraPerfilData[] => {
    if (typeof item?.id !== "string" || typeof item?.text !== "string") return [];
    return [
      {
        id: item.id,
        text: item.text,
        color: isColor(item.color) ? item.color : "azul",
        ...(typeof item.icon === "string" ? { icon: item.icon } : {}),
      },
    ];
  });
}

/** Perfil guardado en Firestore, con valores seguros si falta algún campo. */
export function mapProfile(data: DocumentData, fallbackName: string): DatosPerfil {
  const name =
    typeof data.nombre === "string" && data.nombre ? data.nombre : fallbackName;
  return {
    photo: typeof data.fotoUrl === "string" ? data.fotoUrl : null,
    name: name.slice(0, MAX_NOMBRE),
    description: typeof data.descripcion === "string" ? data.descripcion : "",
    color: isColor(data.color) ? data.color : "azul",
    pills: mapPills(data.etiquetas),
    stickers: Array.isArray(data.stickers)
      ? data.stickers.filter((id): id is string => typeof id === "string")
      : [],
  };
}

/** Los campos editables del perfil, tal como se guardan en Firestore. */
export function toProfileDocument(data: DatosPerfil) {
  return {
    nombre: data.name,
    fotoUrl: data.photo,
    descripcion: data.description,
    color: data.color,
    // Firestore no admite `undefined`: el icono solo se escribe si existe
    etiquetas: data.pills.map(({ id, text, color, icon }) => ({
      id,
      text,
      color,
      ...(icon ? { icon } : {}),
    })),
    stickers: data.stickers,
  };
}

/** Ficha con todos los campos actuales y sin el correo que guardaban versiones anteriores. */
export function isCurrentProfileDocument(data: DocumentData): boolean {
  return (
    data.correo === undefined &&
    data.fotoUrl !== undefined &&
    typeof data.descripcion === "string" &&
    isColor(data.color) &&
    Array.isArray(data.etiquetas) &&
    Array.isArray(data.stickers)
  );
}
