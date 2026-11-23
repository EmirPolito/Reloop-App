import type { DocumentData } from "firebase/firestore";

import { isOrb } from "@/constants/orbes";
import { PATRON_USERNAME, normalizarNombre } from "./nombreUsuario";
import {
  COLORES_PERFIL,
  DISENO_TARJETA_BASE,
  esColorDestacado,
  MAX_NOMBRE,
  MAX_DESTACADO,
  MAX_NOTA,
  MAX_PILDORAS,
  type ColorPerfil,
  type DatosPerfil,
  type PildoraPerfilData,
} from "./temasPerfil";

export function defaultProfile(name: string): DatosPerfil {
  return {
    photo: null,
    orb: null,
    cover: null,
    name: name.slice(0, MAX_NOMBRE),
    username: null,
    description: "",
    color: "azul",
    pills: [],
    tarjeta: DISENO_TARJETA_BASE,
    stickers: [],
    onboardingPendiente: false,
  };
}

function isColor(value: unknown): value is ColorPerfil {
  return COLORES_PERFIL.includes(value as ColorPerfil);
}

function mapPills(value: unknown): PildoraPerfilData[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item): PildoraPerfilData[] => {
      if (typeof item?.id !== "string" || typeof item?.text !== "string")
        return [];
      return [
        {
          id: item.id,
          text: item.text,
          color: isColor(item.color) ? item.color : "azul",
          ...(typeof item.icon === "string" ? { icon: item.icon } : {}),
        },
      ];
    })
    .slice(0, MAX_PILDORAS);
}

/** Perfil guardado en Firestore, con valores seguros si falta algún campo. */
export function mapProfile(
  data: DocumentData,
  fallbackName: string,
): DatosPerfil {
  const name =
    typeof data.nombre === "string" && data.nombre ? data.nombre : fallbackName;
  return {
    photo: typeof data.fotoUrl === "string" ? data.fotoUrl : null,
    orb: isOrb(data.orbe) ? data.orbe : null,
    cover: typeof data.fondoUrl === "string" ? data.fondoUrl : null,
    name: name.slice(0, MAX_NOMBRE),
    username:
      typeof data.usernameNormalized === "string" &&
      PATRON_USERNAME.test(data.usernameNormalized)
        ? data.usernameNormalized
        : null,
    description: typeof data.descripcion === "string" ? data.descripcion : "",
    color: isColor(data.color) ? data.color : "azul",
    pills: mapPills(data.etiquetas),
    tarjeta: {
      fondo:
        typeof data.tarjetaFondo === "string" &&
        /^#[0-9A-Fa-f]{6}$/.test(data.tarjetaFondo)
          ? data.tarjetaFondo
          : null,
      texto:
        data.tarjetaTexto === "claro" || data.tarjetaTexto === "oscuro"
          ? data.tarjetaTexto
          : null,
      imagen:
        typeof data.tarjetaImagen === "string" &&
        data.tarjetaImagen.startsWith("https://")
          ? data.tarjetaImagen
          : null,
      destacado:
        typeof data.tarjetaDestacado === "string" &&
        data.tarjetaDestacado.trim()
          ? data.tarjetaDestacado.slice(0, MAX_DESTACADO)
          : null,
      nota:
        typeof data.tarjetaNota === "string" && data.tarjetaNota.trim()
          ? data.tarjetaNota.slice(0, MAX_NOTA)
          : null,
      colorDestacado: esColorDestacado(data.tarjetaColorDestacado)
        ? data.tarjetaColorDestacado
        : null,
      colorNota: esColorDestacado(data.tarjetaColorNota)
        ? data.tarjetaColorNota
        : null,
    },
    stickers: Array.isArray(data.stickers)
      ? data.stickers.filter((id): id is string => typeof id === "string")
      : [],
    onboardingPendiente: data.onboardingPendiente === true,
  };
}

/**
 * Los campos editables del perfil, tal como se guardan en Firestore. El username no va
 * aquí: solo lo escribe `claimUsername`, junto con su reserva.
 */
export function toProfileDocument(data: DatosPerfil) {
  return {
    nombre: data.name,
    // Para buscar personas por nombre (prefijo, sin mayúsculas ni acentos)
    nombreNormalizado: normalizarNombre(data.name),
    fotoUrl: data.photo,
    // Sin orbe o sin portada no se escribe el campo (al quitarlos, saveProfileData lo borra)
    ...(data.orb !== null ? { orbe: data.orb } : {}),
    ...(data.cover ? { fondoUrl: data.cover } : {}),
    // Sin diseño propio (o al quitarlo) no se escribe el campo; saveProfileData lo borra
    ...(data.tarjeta.fondo ? { tarjetaFondo: data.tarjeta.fondo } : {}),
    ...(data.tarjeta.texto ? { tarjetaTexto: data.tarjeta.texto } : {}),
    ...(data.tarjeta.imagen ? { tarjetaImagen: data.tarjeta.imagen } : {}),
    ...(data.tarjeta.destacado
      ? { tarjetaDestacado: data.tarjeta.destacado }
      : {}),
    ...(data.tarjeta.nota ? { tarjetaNota: data.tarjeta.nota } : {}),
    ...(data.tarjeta.colorDestacado
      ? { tarjetaColorDestacado: data.tarjeta.colorDestacado }
      : {}),
    ...(data.tarjeta.colorNota
      ? { tarjetaColorNota: data.tarjeta.colorNota }
      : {}),
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
    typeof data.nombreNormalizado === "string" &&
    typeof data.descripcion === "string" &&
    isColor(data.color) &&
    Array.isArray(data.etiquetas) &&
    Array.isArray(data.stickers)
  );
}
