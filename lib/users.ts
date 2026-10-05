import { collection, doc, onSnapshot } from "firebase/firestore";
import type {
  DocumentData,
  DocumentSnapshot,
  FirestoreError,
  Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import type { UserProfile } from "./types";

const USERS_COLLECTION = "users";

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Reads an array of strings, dropping blanks and anything that is not a string. */
export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/** Maps a `users` document to a `UserProfile`, tolerating partially filled docs. */
export function toUserProfile(
  snapshot: DocumentSnapshot<DocumentData>,
): UserProfile | null {
  const data = snapshot.data();
  if (!data) return null;

  return {
    uid: snapshot.id,
    displayName: readString(data.displayName),
    departmentId: readString(data.department),
    weeklyCapacity:
      typeof data.weeklyCapacity === "number" && Number.isFinite(data.weeklyCapacity)
        ? data.weeklyCapacity
        : 0,
    role: readString(data.role),
    tags: readStringArray(data.tags),
    areasOfOwnership: readStringArray(data.areasOfOwnership),
  };
}

/** Live profile for a single user. Emits `null` while the document is absent. */
export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snapshot) => onChange(toUserProfile(snapshot)),
    (error) => onError?.(error),
  );
}

/**
 * Live map of `uid -> UserProfile` used to label commitment owners.
 *
 * Callers treat failure as non-fatal: the ledger still renders, it just falls
 * back to raw owner ids.
 */
export function subscribeToDirectory(
  onChange: (directory: Map<string, UserProfile>) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      const directory = new Map<string, UserProfile>();
      for (const document of snapshot.docs) {
        const profile = toUserProfile(document);
        if (profile) directory.set(profile.uid, profile);
      }
      onChange(directory);
    },
    (error) => onError?.(error),
  );
}
