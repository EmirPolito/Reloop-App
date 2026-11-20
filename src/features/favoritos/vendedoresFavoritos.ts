import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { useCallback } from "react";

import { useAvisos } from "@/features/avisos/AvisosProvider";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { db } from "@/lib/firebase";
import { crearSuscripcionCompartida } from "@/lib/sharedSubscription";
import { showErrorAlert } from "@/utils/alerts";

/** `usuarios/{uid}/favoritosVendedores/{sellerId}`: las tarjetas de vendedor que `uid` guardó */
function coleccion(uid: string) {
  return collection(db, "usuarios", uid, "favoritosVendedores");
}

function suscribir(
  uid: string,
  alDato: (ids: string[]) => void,
  alError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    coleccion(uid),
    (snapshot) => alDato(snapshot.docs.map((item) => item.id)),
    alError,
  );
}

/** Una sola suscripción por persona, compartida por todas las tarjetas y por Favoritos */
const useIdsDe = crearSuscripcionCompartida<string[]>(
  "los vendedores favoritos",
  suscribir,
);

const SIN_IDS: string[] = [];

async function guardar(
  uid: string,
  sellerId: string,
  favorito: boolean,
): Promise<void> {
  const ref = doc(coleccion(uid), sellerId);
  if (favorito) await setDoc(ref, { sellerId, creadoEn: serverTimestamp() });
  else await deleteDoc(ref);
}

/**
 * Tarjetas de vendedor guardadas en favoritos (el corazón de abajo a la derecha de la
 * tarjeta). `alternar` las guarda o las quita y avisa arriba, como con las publicaciones.
 */
export function useVendedoresFavoritos() {
  const { uid } = useSessionUser();
  const { mostrar } = useAvisos();
  const ids = useIdsDe(uid) ?? SIN_IDS;

  const alternar = useCallback(
    (sellerId: string) => {
      const favorito = !ids.includes(sellerId);
      guardar(uid, sellerId, favorito).then(
        () =>
          mostrar(
            favorito
              ? {
                  tipo: "favorito",
                  titulo: "Guardada en favoritos",
                  descripcion: "Podrás verla en tu lista de favoritos.",
                }
              : {
                  tipo: "sinFavorito",
                  titulo: "Eliminada de favoritos",
                  descripcion: "Ya no aparece en tu lista de favoritos.",
                },
          ),
        (error) => showErrorAlert("No se pudo actualizar tus favoritos", error),
      );
    },
    [uid, ids, mostrar],
  );

  /** Quita varias a la vez (el modo de selección de Favoritos); quien llama avisa */
  const quitar = useCallback(
    async (sellerIds: string[]) => {
      await Promise.all(sellerIds.map((id) => guardar(uid, id, false)));
    },
    [uid],
  );

  return { ids, alternar, quitar };
}
