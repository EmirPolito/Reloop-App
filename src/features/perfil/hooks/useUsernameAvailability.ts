import { useEffect, useState } from "react";

import { describeFirestoreError } from "@/lib/firestoreValues";
import {
  MENSAJE_INVALIDO,
  normalizarUsername,
  validarUsername,
} from "../username";
import { isUsernameAvailable } from "../usernameRepository";

/** Espera tras la última tecla antes de consultar */
const ESPERA_MS = 300;

export type DisponibilidadUsername =
  | { estado: "sinCambios" }
  | { estado: "invalido"; mensaje: string }
  | { estado: "verificando" }
  | { estado: "disponible" }
  | { estado: "ocupado" }
  | { estado: "error" };

interface Consulta {
  username: string;
  resultado: DisponibilidadUsername;
}

/**
 * Disponibilidad en vivo de un username mientras se escribe: el formato se valida al
 * instante y la reserva se consulta cuando la persona deja de escribir. Las respuestas
 * de textos que ya cambiaron se descartan.
 */
export function useUsernameAvailability(
  texto: string,
  actual: string | null,
  uid: string,
): DisponibilidadUsername {
  const username = normalizarUsername(texto);
  const motivo = validarUsername(username);
  const debeConsultar = username !== actual && motivo === null;
  const [consulta, setConsulta] = useState<Consulta | null>(null);

  useEffect(() => {
    if (!debeConsultar) return;
    let vigente = true;
    const espera = setTimeout(() => {
      isUsernameAvailable(username, uid)
        .then((libre) => {
          if (vigente) {
            setConsulta({
              username,
              resultado: { estado: libre ? "disponible" : "ocupado" },
            });
          }
        })
        .catch((error) => {
          console.warn("No se pudo verificar el usuario.", describeFirestoreError(error));
          if (vigente) setConsulta({ username, resultado: { estado: "error" } });
        });
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [debeConsultar, username, uid]);

  if (username === actual) return { estado: "sinCambios" };
  if (motivo) return { estado: "invalido", mensaje: MENSAJE_INVALIDO[motivo] };
  return consulta?.username === username
    ? consulta.resultado
    : { estado: "verificando" };
}
