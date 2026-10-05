import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
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
const PROJECTS_COLLECTION = "projects";

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
    projectId: readNullableString(data.projectId),
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
  /** Project this commitment counts toward, or `null` for standalone work. */
  projectId: string | null;
};

/**
 * Writes a new commitment. New work always starts `pending`.
 *
 * A linked commitment is one more task on its project, so the commitment and
 * the project's `totalTasks` bump go in one batch: both land or neither does.
 * If the project has been deleted, the batch fails and nothing is written.
 */
export async function createCommitment(input: NewCommitmentInput): Promise<void> {
  const batch = writeBatch(db);
  const commitmentRef = doc(collection(db, COMMITMENTS_COLLECTION));

  batch.set(commitmentRef, {
    ownerId: input.ownerId,
    ownerEmail: input.ownerEmail,
    objective: input.objective.trim(),
    deliverableExpected: input.deliverableExpected.trim(),
    status: "pending",
    blockerReason: null,
    evidenceLink: null,
    projectId: input.projectId,
    deadline: Timestamp.fromDate(input.deadline),
    createdAt: serverTimestamp(),
  });

  if (input.projectId) {
    batch.update(doc(db, PROJECTS_COLLECTION, input.projectId), {
      totalTasks: increment(1),
    });
  }

  await batch.commit();
}

/**
 * Closes out a commitment. Evidence is mandatory — a commitment cannot be
 * called done on the owner's word alone.
 *
 * Runs as a transaction so a linked project's `completedTasks` moves only on a
 * real transition into `completed`, read from the server rather than from a
 * possibly stale UI. A deleted project does not block completing the work.
 */
export async function completeCommitment(
  id: string,
  evidenceLink: string,
): Promise<void> {
  const commitmentRef = doc(db, COMMITMENTS_COLLECTION, id);

  await runTransaction(db, async (transaction) => {
    const commitment = await transaction.get(commitmentRef);
    if (!commitment.exists()) {
      throw new Error("This commitment no longer exists.");
    }

    const wasCompleted = commitment.get("status") === "completed";
    const projectRef = linkedProjectRef(commitment.get("projectId"));
    // Transactions require every read before the first write.
    const project = projectRef ? await transaction.get(projectRef) : null;

    transaction.update(commitmentRef, {
      status: "completed",
      evidenceLink: evidenceLink.trim(),
      blockerReason: null,
    });

    if (!wasCompleted && projectRef && project?.exists()) {
      transaction.update(projectRef, { completedTasks: increment(1) });
    }
  });
}

/** Reference to the project a commitment is linked to, if it has one. */
function linkedProjectRef(projectId: unknown) {
  return typeof projectId === "string" && projectId.length > 0
    ? doc(db, PROJECTS_COLLECTION, projectId)
    : null;
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

/**
 * Returns a blocked or completed commitment to the active pile.
 *
 * Reopening completed linked work takes it back off the project's
 * `completedTasks`; otherwise complete → reopen → complete would count it twice.
 */
export async function reopenCommitment(id: string): Promise<void> {
  const commitmentRef = doc(db, COMMITMENTS_COLLECTION, id);

  await runTransaction(db, async (transaction) => {
    const commitment = await transaction.get(commitmentRef);
    if (!commitment.exists()) {
      throw new Error("This commitment no longer exists.");
    }

    const wasCompleted = commitment.get("status") === "completed";
    const projectRef = linkedProjectRef(commitment.get("projectId"));
    const project = projectRef ? await transaction.get(projectRef) : null;

    transaction.update(commitmentRef, {
      status: "pending",
      blockerReason: null,
    });

    if (wasCompleted && projectRef && project?.exists()) {
      const completed = project.get("completedTasks");
      transaction.update(projectRef, {
        completedTasks:
          typeof completed === "number" && completed > 0 ? completed - 1 : 0,
      });
    }
  });
}
