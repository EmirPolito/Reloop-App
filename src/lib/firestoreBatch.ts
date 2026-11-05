import { writeBatch, type WriteBatch } from "firebase/firestore";

import { db } from "./firebase";

/** Firestore admite 500 operaciones por lote; se deja margen. */
const BATCH_LIMIT = 400;

/** Aplica `apply` a cada elemento repartiéndolos en tantos lotes como hagan falta. */
export async function commitInChunks<T>(
  items: T[],
  apply: (batch: WriteBatch, item: T) => void,
): Promise<void> {
  for (let start = 0; start < items.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const item of items.slice(start, start + BATCH_LIMIT)) apply(batch, item);
    await batch.commit();
  }
}
