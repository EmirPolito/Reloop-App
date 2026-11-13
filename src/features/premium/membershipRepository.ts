import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { mapMembership, type Membership } from "./membershipRules";

const MEMBERSHIPS = "membresias";

/** Membresía de una persona en tiempo real (`null` si no tiene). Solo lectura. */
export function subscribeMembership(
  uid: string,
  onData: (membership: Membership | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, MEMBERSHIPS, uid),
    (snapshot) => onData(mapMembership(snapshot.data())),
    onError,
  );
}
