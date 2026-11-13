import { useCallback, useEffect, useState } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";
import { searchUsers, type UsuarioEncontrado } from "../userSearchRepository";

/** Espera tras la última tecla antes de consultar */
const ESPERA_MS = 300;

export type EstadoBusquedaUsuarios =
  | { estado: "cargando" }
  | { estado: "listo"; usuarios: UsuarioEncontrado[] }
  | { estado: "error" };

interface Respuesta {
  termino: string;
  intento: number;
  resultado: EstadoBusquedaUsuarios;
}

/**
 * Busca personas mientras se escribe: espera a que se deje de teclear y descarta las
 * respuestas de términos que ya cambiaron, así una respuesta lenta nunca pisa a la última.
 */
export function useUserSearch(termino: string): EstadoBusquedaUsuarios & {
  reintentar: () => void;
} {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);

  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(() => {
      searchUsers(termino)
        .then((usuarios) => {
          if (vigente) {
            setRespuesta({ termino, intento, resultado: { estado: "listo", usuarios } });
          }
        })
        .catch((error) => {
          console.warn("No se pudo buscar personas.", describeFirestoreError(error));
          if (vigente) setRespuesta({ termino, intento, resultado: { estado: "error" } });
        });
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [termino, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const actual =
    respuesta?.termino === termino && respuesta.intento === intento
      ? respuesta.resultado
      : ({ estado: "cargando" } as const);
  return { ...actual, reintentar };
}
