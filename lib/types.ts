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
  /**
   * Id of a `departments` document. Stored in Firestore as `department`;
   * empty when the person is unassigned.
   */
  departmentId: string;
  weeklyCapacity: number;
  /** Job title, e.g. "Product Engineer". */
  role: string;
  /** Functional tags, e.g. "frontend", "sales". */
  tags: string[];
  /** What this person is the go-to owner for. */
  areasOfOwnership: string[];
};

/** A document in the `departments` collection. */
export type Department = {
  id: string;
  name: string;
  /** uid of the department lead — maps to `users`. */
  leadId: string;
  objectives: string[];
  kpis: string[];
};

/** Pipeline stages, in the order a project moves through them. */
export const PROJECT_STAGES = [
  "Idea",
  "Research",
  "Validation",
  "MVP",
  "Pilot",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];

export function isProjectStage(value: unknown): value is ProjectStage {
  return PROJECT_STAGES.includes(value as ProjectStage);
}

export const PROJECT_STATUSES = [
  "On Track",
  "At Risk",
  "Blocked",
  "Complete",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

/** A document in the `projects` collection. */
export type Project = {
  id: string;
  name: string;
  /** uid of the project owner — maps to `users`. */
  ownerId: string;
  departmentId: string;
  objective: string;
  stage: ProjectStage;
  status: ProjectStatus;
  evidenceLinks: string[];
  totalTasks: number;
  completedTasks: number;
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
  /** The project this commitment advances, or `null` for standalone work. */
  projectId: string | null;
  deadline: Timestamp | null;
  createdAt: Timestamp | null;
};
