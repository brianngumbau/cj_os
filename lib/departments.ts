import { collection, onSnapshot } from "firebase/firestore";
import type {
  DocumentData,
  FirestoreError,
  QueryDocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "./firebase";
import type { Department } from "./types";
import { readString, readStringArray } from "./users";

const DEPARTMENTS_COLLECTION = "departments";

function toDepartment(snapshot: QueryDocumentSnapshot<DocumentData>): Department {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: readString(data.name),
    leadId: readString(data.leadId),
    objectives: readStringArray(data.objectives),
    kpis: readStringArray(data.kpis),
  };
}

/**
 * Live map of `departmentId -> Department`.
 *
 * Sorting happens client-side rather than with `orderBy("name")`, because
 * Firestore silently drops documents that lack the ordered field.
 */
export function subscribeToDepartments(
  onChange: (departments: Map<string, Department>) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, DEPARTMENTS_COLLECTION),
    (snapshot) => {
      const departments = new Map<string, Department>();
      for (const document of snapshot.docs) {
        departments.set(document.id, toDepartment(document));
      }
      onChange(departments);
    },
    (error) => {
      console.error("Firestore fetch error (departments):", error);
      onError?.(error);
    },
  );
}

/**
 * Departments for components that only need to label things. `departments` is
 * `null` until the first snapshot arrives. Firestore shares one listener
 * across identical queries, so calling this from several components is cheap.
 */
export function useDepartments(): {
  departments: Map<string, Department> | null;
  error: FirestoreError | null;
} {
  const [departments, setDepartments] = useState<Map<string, Department> | null>(
    null,
  );
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    return subscribeToDepartments(
      (next) => {
        setDepartments(next);
        setError(null);
      },
      setError,
    );
  }, []);

  return { departments, error };
}

/**
 * Display name for a `users.department` value. Falls back to the raw value so
 * a stale id — or a name left over from before departments had ids — still
 * shows something instead of vanishing.
 */
export function departmentLabel(
  departments: Map<string, Department> | null,
  departmentId: string,
): string {
  if (!departmentId) return "";
  return departments?.get(departmentId)?.name || departmentId;
}
