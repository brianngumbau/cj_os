import type { Timestamp } from "firebase/firestore";

/** The three states a commitment can be in. Mirrors the `status` enum in Firestore. */
export const COMMITMENT_STATUSES = ["pending", "completed", "blocked"] as const;

export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number];

export function isCommitmentStatus(value: unknown): value is CommitmentStatus {
  return COMMITMENT_STATUSES.includes(value as CommitmentStatus);
}

/** A document in the `users` collection. Provisioned by an admin, not by the app. */
export type UserProfile = {
  uid: string;
  displayName: string;
  department: string;
  weeklyCapacity: number;
};

/**
 * A document in the `commitments` collection.
 *
 * `deadline` and `createdAt` are nullable here even though every write sets
 * them: `createdAt` uses `serverTimestamp()`, which reads back as `null` in the
 * local snapshot until the server acknowledges the write.
 */
export type Commitment = {
  id: string;
  ownerId: string;
  ownerEmail: string | null;
  objective: string;
  deliverableExpected: string;
  status: CommitmentStatus;
  blockerReason: string | null;
  evidenceLink: string | null;
  deadline: Timestamp | null;
  createdAt: Timestamp | null;
};
