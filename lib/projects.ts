import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import type {
  DocumentData,
  FirestoreError,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";

import { db } from "./firebase";
import { isProjectStage, isProjectStatus } from "./types";
import type { Project, ProjectStage, ProjectStatus } from "./types";
import { readString, readStringArray } from "./users";

const PROJECTS_COLLECTION = "projects";

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

/** Maps a Firestore document to a `Project`, defaulting anything malformed. */
function toProject(snapshot: QueryDocumentSnapshot<DocumentData>): Project {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: readString(data.name),
    ownerId: readString(data.ownerId),
    departmentId: readString(data.departmentId),
    objective: readString(data.objective),
    stage: isProjectStage(data.stage) ? data.stage : "Idea",
    status: isProjectStatus(data.status) ? data.status : "On Track",
    evidenceLinks: readStringArray(data.evidenceLinks),
    totalTasks: readCount(data.totalTasks),
    completedTasks: readCount(data.completedTasks),
  };
}

/** Completion as a whole percentage in 0–100. A project with no tasks is 0%. */
export function projectProgress(project: Project): number {
  if (project.totalTasks === 0) return 0;
  const percent = (project.completedTasks / project.totalTasks) * 100;
  return Math.round(Math.min(100, Math.max(0, percent)));
}

/**
 * Live view of every project, sorted by name client-side — an `orderBy` would
 * silently drop documents missing the ordered field.
 */
export function subscribeToProjects(
  onChange: (projects: Project[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, PROJECTS_COLLECTION),
    (snapshot) =>
      onChange(
        snapshot.docs
          .map(toProject)
          .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id)),
      ),
    (error) => {
      console.error("Firestore fetch error (projects):", error);
      onError(error);
    },
  );
}

export type NewProjectInput = {
  name: string;
  ownerId: string;
  departmentId: string;
  objective: string;
  stage: ProjectStage;
  status: ProjectStatus;
};

/**
 * Writes a new project. Task counters start at zero — they are driven by
 * linked commitments, not typed in by hand.
 */
export async function createProject(input: NewProjectInput): Promise<void> {
  await addDoc(collection(db, PROJECTS_COLLECTION), {
    name: input.name.trim(),
    ownerId: input.ownerId,
    departmentId: input.departmentId,
    objective: input.objective.trim(),
    stage: input.stage,
    status: input.status,
    evidenceLinks: [],
    totalTasks: 0,
    completedTasks: 0,
    createdAt: serverTimestamp(),
  });
}
