import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";

/** Cuántas búsquedas recientes se recuerdan */
const MAXIMO = 8;

const clave = (espacio: string, uid: string) =>
  `reloop:${espacio}:recientes:${uid}`;

function leer(valor: string | null): string[] {
  try {
    const lista: unknown = valor ? JSON.parse(valor) : [];
    return Array.isArray(lista)
      ? lista.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Búsquedas recientes de cada cuenta, guardadas en este dispositivo. La más nueva va
 * primero y no se repiten (sin distinguir mayúsculas). `espacio` separa listas distintas
 * (la búsqueda del inicio y la de chats).
 */
export function useBusquedasRecientes(espacio = "busqueda") {
  const uid = useAuth().user?.uid ?? "";
  const [recientes, setRecientes] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;
    let vigente = true;
    AsyncStorage.getItem(clave(espacio, uid))
      .then((valor) => {
        if (vigente) setRecientes(leer(valor));
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [espacio, uid]);

  const cambiar = useCallback(
    (cambio: (lista: string[]) => string[]) => {
      setRecientes((lista) => {
        const nueva = cambio(lista);
        if (uid) {
          AsyncStorage.setItem(clave(espacio, uid), JSON.stringify(nueva)).catch(
            (error) =>
              console.warn("No se pudieron guardar las búsquedas.", error),
          );
        }
        return nueva;
      });
    },
    [espacio, uid],
  );

  const agregar = useCallback(
    (texto: string) => {
      const limpio = texto.trim();
      if (!limpio) return;
      const igual = limpio.toLocaleLowerCase();
      cambiar((lista) =>
        [
          limpio,
          ...lista.filter((item) => item.toLocaleLowerCase() !== igual),
        ].slice(0, MAXIMO),
      );
    },
    [cambiar],
  );

  const quitar = useCallback(
    (texto: string) => cambiar((lista) => lista.filter((item) => item !== texto)),
    [cambiar],
  );

  return { recientes, agregar, quitar };
}
