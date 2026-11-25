import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { mapReview } from "@/features/marketplace/productMappers";
import { db } from "@/lib/firebase";
import { describeFirestoreError } from "@/lib/firestoreValues";
import type { Resena } from "./formatoResena";

const PRODUCTS = "productos";
const RESENAS_LIMIT = 100;

/** `productos/{id}/solicitudes/{compradorId}`: el vendedor le pidió una calificación */
export function solicitudRef(productoId: string, compradorId: string) {
  return doc(db, PRODUCTS, productoId, "solicitudes", compradorId);
}

/** `productos/{id}/resenas/{autorId}`: una por persona */
function resenaRef(productoId: string, autorId: string) {
  return doc(db, PRODUCTS, productoId, "resenas", autorId);
}

function subscribeReviews(
  productoId: string,
  alDato: (resenas: Resena[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(db, PRODUCTS, productoId, "resenas"),
      orderBy("creadoEn", "desc"),
      limit(RESENAS_LIMIT),
    ),
    (snapshot) => alDato(snapshot.docs.map(mapReview)),
    (error) =>
      console.warn(
        "No se pudieron leer las reseñas.",
        describeFirestoreError(error),
      ),
  );
}

const SIN_RESENAS: Resena[] = [];

/** Las reseñas de una publicación, de la más nueva a la más vieja, en tiempo real */
export function useResenas(productoId: string, activo: boolean): Resena[] {
  const [resenas, setResenas] = useState<Resena[]>(SIN_RESENAS);
  useEffect(() => {
    if (!activo) return;
    return subscribeReviews(productoId, setResenas);
  }, [productoId, activo]);
  return activo ? resenas : SIN_RESENAS;
}

/**
 * Si ya existe la solicitud y la reseña de un comprador (para el botón del vendedor y la
 * tarjeta del comprador en el chat). `undefined` mientras llega.
 */
export function useEstadoResena(
  productoId: string | undefined,
  compradorId: string | undefined,
  { conSolicitud }: { conSolicitud: boolean },
): { solicitada: boolean; resena: Resena | null } | undefined {
  const [solicitada, setSolicitada] = useState<boolean | undefined>();
  const [resena, setResena] = useState<Resena | null | undefined>();
  const clave = `${productoId}|${compradorId}`;
  const [claveAntes, setClaveAntes] = useState(clave);
  if (clave !== claveAntes) {
    setClaveAntes(clave);
    setSolicitada(undefined);
    setResena(undefined);
  }

  useEffect(() => {
    if (!productoId || !compradorId) return;
    const bajas = [
      onSnapshot(
        resenaRef(productoId, compradorId),
        (snap) => setResena(snap.exists() ? mapReview(snap) : null),
        () => setResena(null),
      ),
    ];
    if (conSolicitud) {
      bajas.push(
        onSnapshot(
          solicitudRef(productoId, compradorId),
          (snap) => setSolicitada(snap.exists()),
          () => setSolicitada(false),
        ),
      );
    }
    return () => bajas.forEach((baja) => baja());
  }, [productoId, compradorId, conSolicitud]);

  if (resena === undefined || (conSolicitud && solicitada === undefined))
    return undefined;
  return { solicitada: solicitada ?? true, resena };
}

/**
 * Guarda la reseña y suma sus estrellas al promedio de la publicación en un solo lote: las
 * reglas comprueban que las dos cosas cuadren y que el vendedor la haya pedido.
 */
export async function enviarResena(
  productoId: string,
  autor: { id: string; nombre: string },
  { estrellas, texto }: { estrellas: number; texto: string },
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(resenaRef(productoId, autor.id), {
    autor: autor.nombre,
    estrellas,
    texto: texto.trim(),
    creadoEn: serverTimestamp(),
  });
  batch.update(doc(db, PRODUCTS, productoId), {
    resenasTotal: increment(estrellas),
    resenasCount: increment(1),
  });
  await batch.commit();
}
