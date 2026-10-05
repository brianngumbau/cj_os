"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FirestoreError } from "firebase/firestore";

import { displayNameFor } from "@/lib/auth-context";
import { departmentLabel, useDepartments } from "@/lib/departments";
import type { Department, UserProfile } from "@/lib/types";
import { subscribeToDirectory } from "@/lib/users";
import { errorClass } from "./form-styles";
import { FullScreenStatus } from "./full-screen-status";

function describeDirectoryError(error: FirestoreError): string {
  if (error.code === "permission-denied") {
    return "Firestore refused this read. Check the security rules on the users collection.";
  }
  if (error.code === "unavailable") {
    return "Cannot reach Firestore. Check your connection.";
  }
  return `Could not load the directory (${error.code}).`;
}

/** Everyone in the `users` collection, as a card grid sorted by name. */
export function PeopleDirectory() {
  const [people, setPeople] = useState<UserProfile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { departments } = useDepartments();

  useEffect(() => {
    return subscribeToDirectory(
      (directory) => {
        setPeople([...directory.values()]);
        setLoadError(null);
      },
      (error) => {
        console.error("Firestore fetch error (users):", error);
        setLoadError(describeDirectoryError(error));
      },
    );
  }, []);

  const sorted = useMemo(
    () =>
      [...(people ?? [])].sort((a, b) =>
        displayNameFor(a, null, a.uid).localeCompare(
          displayNameFor(b, null, b.uid),
        ),
      ),
    [people],
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">People directory</h1>
        <p className="mt-1 text-sm text-muted">
          {people
            ? `${people.length} ${people.length === 1 ? "person" : "people"} — who does what, and how much they can take on each week.`
            : "Who does what, and how much they can take on each week."}
        </p>
      </div>

      {loadError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {loadError}
        </p>
      ) : null}

      <div className="mt-6">
        {people === null && !loadError ? (
          <FullScreenStatus message="Loading directory" />
        ) : sorted.length === 0 && !loadError ? (
          <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <p className="text-sm font-medium">The directory is empty.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              People appear here once an admin adds their document to the users
              collection.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((person) => (
              <PersonCard
                key={person.uid}
                person={person}
                departments={departments}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function PersonCard({
  person,
  departments,
}: {
  person: UserProfile;
  departments: Map<string, Department> | null;
}) {
  return (
    <li className="flex flex-col rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {displayNameFor(person, null, person.uid)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {person.role || "Role not set"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg leading-none">
            {person.weeklyCapacity > 0 ? person.weeklyCapacity : "—"}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted">
            Weekly cap.
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Department
          </dt>
          <dd className="mt-0.5">{departmentLabel(departments, person.departmentId) || "Unassigned"}</dd>
        </div>

        {person.areasOfOwnership.length > 0 ? (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Owns
            </dt>
            <dd className="mt-0.5 leading-relaxed">
              {person.areasOfOwnership.join(" · ")}
            </dd>
          </div>
        ) : null}
      </dl>

      {person.tags.length > 0 ? (
        <ul aria-label="Tags" className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {person.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
