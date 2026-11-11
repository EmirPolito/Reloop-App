import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/** `usuarios/{uid}/seguidores/{followerId}`: un doc por cada persona que sigue a `uid`. */
function followersOf(uid: string) {
  return collection(db, "usuarios", uid, "seguidores");
}

/** Seguidores de una persona en tiempo real (los uid de quienes la siguen). */
export function subscribeFollowers(
  uid: string,
  onData: (followerIds: string[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    followersOf(uid),
    (snapshot) => onData(snapshot.docs.map((d) => d.id)),
    onError,
  );
}

export async function follow(uid: string, followerId: string): Promise<void> {
  await setDoc(doc(followersOf(uid), followerId), {
    creadoEn: serverTimestamp(),
  });
}

export async function unfollow(uid: string, followerId: string): Promise<void> {
  await deleteDoc(doc(followersOf(uid), followerId));
}
