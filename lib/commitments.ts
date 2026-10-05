import {
  Timestamp,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type {
  DocumentData,
  FirestoreError,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { isCommitmentStatus } from "./types";
import type { Commitment } from "./types";

const COMMITMENTS_COLLECTION = "commitments";

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

/**
 * Maps a Firestore document to a `Commitment`.
 *
 * Every field is read defensively: the ledger is a live view, so one
 * hand-edited or half-written document should not blank the whole table.
 */
function toCommitment(snapshot: QueryDocumentSnapshot<DocumentData>): Commitment {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    ownerId: readString(data.ownerId),
    ownerEmail: readNullableString(data.ownerEmail),
    objective: readString(data.objective),
    deliverableExpected: readString(data.deliverableExpected),
    status: isCommitmentStatus(data.status) ? data.status : "pending",
    blockerReason: readNullableString(data.blockerReason),
    evidenceLink: readNullableString(data.evidenceLink),
    deadline: readTimestamp(data.deadline),
    createdAt: readTimestamp(data.createdAt),
  };
}

/**
 * Live view of the whole ledger, soonest deadline first.
 *
 * Ordering on a single field keeps this index-free — no composite index has to
 * be created in the Firebase console before the dashboard works.
 */
export function subscribeToCommitments(
  onChange: (commitments: Commitment[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  const ledger = query(
    collection(db, COMMITMENTS_COLLECTION),
    orderBy("deadline", "asc"),
  );

  return onSnapshot(
    ledger,
    (snapshot) => onChange(snapshot.docs.map(toCommitment)),
    (error) => {
      console.error("Firestore fetch error:", error);
      onError(error);
    },
  );
}

export type NewCommitmentInput = {
  ownerId: string;
  ownerEmail: string | null;
  objective: string;
  deliverableExpected: string;
  deadline: Date;
};

/** Writes a new commitment. New work always starts `pending`. */
export async function createCommitment(input: NewCommitmentInput): Promise<void> {
  await addDoc(collection(db, COMMITMENTS_COLLECTION), {
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail,
    objective: input.objective.trim(),
    deliverableExpected: input.deliverableExpected.trim(),
    status: "pending",
    blockerReason: null,
    evidenceLink: null,
    deadline: Timestamp.fromDate(input.deadline),
    createdAt: serverTimestamp(),
  });
}

/**
 * Closes out a commitment. Evidence is mandatory — a commitment cannot be
 * called done on the owner's word alone.
 */
export async function completeCommitment(
  id: string,
  evidenceLink: string,
): Promise<void> {
  await updateDoc(doc(db, COMMITMENTS_COLLECTION, id), {
    status: "completed",
    evidenceLink: evidenceLink.trim(),
    blockerReason: null,
  });
}

/** Flags a commitment as blocked. The reason is mandatory. */
export async function blockCommitment(
  id: string,
  blockerReason: string,
): Promise<void> {
  await updateDoc(doc(db, COMMITMENTS_COLLECTION, id), {
    status: "blocked",
    blockerReason: blockerReason.trim(),
  });
}

/** Returns a blocked or completed commitment to the active pile. */
export async function reopenCommitment(id: string): Promise<void> {
  await updateDoc(doc(db, COMMITMENTS_COLLECTION, id), {
    status: "pending",
    blockerReason: null,
  });
}
