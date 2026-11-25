import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { useSessionUser } from "@/features/session/SessionUserProvider";
import { db } from "@/lib/firebase";
import { crearSuscripcionCompartida } from "@/lib/sharedSubscription";
import { leerTarjetaCompartida, type Tarjeta } from "./formatoTarjeta";

/** `usuarios/{uid}/tarjetas/{id}`: privadas, solo su dueña las lee y escribe */
function coleccion(uid: string) {
  return collection(db, "usuarios", uid, "tarjetas");
}

function suscribir(
  uid: string,
  alDato: (tarjetas: Tarjeta[]) => void,
  alError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    query(coleccion(uid), orderBy("creadoEn", "asc")),
    (snapshot) =>
      alDato(
        snapshot.docs.flatMap((item) => {
          const tarjeta = leerTarjetaCompartida(item.data());
          return tarjeta ? [{ ...tarjeta, id: item.id }] : [];
        }),
      ),
    alError,
  );
}

/** Una sola suscripción por persona, compartida por la billetera del chat y la pantalla de tarjetas */
const useTarjetasDe = crearSuscripcionCompartida<Tarjeta[]>(
  "las tarjetas",
  suscribir,
);

const SIN_TARJETAS: Tarjeta[] = [];

/** Las tarjetas de la persona con sesión, en tiempo real (de la más antigua a la más nueva) */
export function useTarjetas(): Tarjeta[] {
  const { uid } = useSessionUser();
  return useTarjetasDe(uid) ?? SIN_TARJETAS;
}

export async function guardarTarjeta(
  uid: string,
  tarjeta: Omit<Tarjeta, "id">,
): Promise<string> {
  const ref = await addDoc(coleccion(uid), {
    ...tarjeta,
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

/** Cambia los datos de una tarjeta guardada (la fecha de creación no cambia) */
export async function actualizarTarjeta(
  uid: string,
  id: string,
  tarjeta: Omit<Tarjeta, "id">,
): Promise<void> {
  await updateDoc(doc(coleccion(uid), id), { ...tarjeta });
}

export async function eliminarTarjeta(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(coleccion(uid), id));
}
