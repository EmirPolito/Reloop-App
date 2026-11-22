import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/** `usuarios/{uid}/seguidores/{followerId}`: un doc por cada persona que sigue a `uid`. */
function followersOf(uid: string) {
  return collection(db, "usuarios", uid, "seguidores");
}

/** `usuarios/{uid}/siguiendo/{followedId}`: un doc por cada persona a la que sigue `uid`. */
function followingOf(uid: string) {
  return collection(db, "usuarios", uid, "siguiendo");
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

/** A quiénes sigue una persona en tiempo real, del seguido más reciente al más antiguo. */
export function subscribeFollowing(
  uid: string,
  onData: (followedIds: string[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    followingOf(uid),
    (snapshot) =>
      onData(
        snapshot.docs
          .map((d) => ({ id: d.id, en: d.get("creadoEn")?.toMillis?.() ?? Date.now() }))
          .sort((a, b) => b.en - a.en)
          .map((d) => d.id),
      ),
    onError,
  );
}

/** Seguidores de una persona, leídos una vez (la lista no cambia hasta volver a leerla). */
export async function getFollowers(uid: string): Promise<string[]> {
  const snapshot = await getDocs(followersOf(uid));
  return snapshot.docs.map((d) => d.id);
}

/** A quiénes sigue una persona, leído una vez (el seguido más reciente primero). */
export async function getFollowing(uid: string): Promise<string[]> {
  const snapshot = await getDocs(followingOf(uid));
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      en: d.get("creadoEn")?.toMillis?.() ?? Date.now(),
    }))
    .sort((a, b) => b.en - a.en)
    .map((d) => d.id);
}

/** Si `followerId` sigue a `uid`, en tiempo real (lee un solo doc). */
export function subscribeIsFollowing(
  uid: string,
  followerId: string,
  onData: (siguiendo: boolean) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(followersOf(uid), followerId),
    (snapshot) => onData(snapshot.exists()),
    onError,
  );
}

/** Seguir escribe los dos lados a la vez: el seguidor de `uid` y el seguido de `followerId`. */
export async function follow(uid: string, followerId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(followersOf(uid), followerId), { creadoEn: serverTimestamp() });
  batch.set(doc(followingOf(followerId), uid), { creadoEn: serverTimestamp() });
  await batch.commit();
}

export async function unfollow(uid: string, followerId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(followersOf(uid), followerId));
  batch.delete(doc(followingOf(followerId), uid));
  await batch.commit();
}
