"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FirestoreError } from "firebase/firestore";

import { displayNameFor } from "@/lib/auth-context";
import { useDepartments } from "@/lib/departments";
import type { Department, UserProfile } from "@/lib/types";
import { subscribeToDirectory } from "@/lib/users";
import { errorClass } from "./form-styles";
import { FullScreenStatus } from "./full-screen-status";

function describeFirestoreError(error: FirestoreError, collection: string): string {
  if (error.code === "permission-denied") {
    return `Firestore refused this read. Check the security rules on the ${collection} collection.`;
  }
  if (error.code === "unavailable") {
    return "Cannot reach Firestore. Check your connection.";
  }
  return `Could not load ${collection} (${error.code}).`;
}

function byName(a: UserProfile, b: UserProfile): number {
  return displayNameFor(a, null, a.uid).localeCompare(displayNameFor(b, null, b.uid));
}

const sectionLabelClass =
  "text-[10px] font-medium uppercase tracking-wide text-muted";

/** Every department with its lead, objectives, KPIs and members. */
export function DepartmentsOverview() {
  const { departments, error: departmentsError } = useDepartments();
  const [people, setPeople] = useState<Map<string, UserProfile> | null>(null);
  const [peopleError, setPeopleError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    return subscribeToDirectory(
      (directory) => {
        setPeople(directory);
        setPeopleError(null);
      },
      (error) => {
        console.error("Firestore fetch error (users):", error);
        setPeopleError(error);
      },
    );
  }, []);

  const { sortedDepartments, membersByDepartment, unassigned } = useMemo(() => {
    const members = new Map<string, UserProfile[]>();
    const orphans: UserProfile[] = [];

    for (const person of people?.values() ?? []) {
      if (person.departmentId && departments?.has(person.departmentId)) {
        const list = members.get(person.departmentId) ?? [];
        list.push(person);
        members.set(person.departmentId, list);
      } else {
        orphans.push(person);
      }
    }
    for (const list of members.values()) list.sort(byName);

    return {
      sortedDepartments: [...(departments?.values() ?? [])].sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id),
      ),
      membersByDepartment: members,
      unassigned: orphans.sort(byName),
    };
  }, [departments, people]);

  const loading =
    (departments === null && !departmentsError) || (people === null && !peopleError);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Departments</h1>
        <p className="mt-1 text-sm text-muted">
          Who leads each department, what it is accountable for, and who is in it.
        </p>
      </div>

      {departmentsError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {describeFirestoreError(departmentsError, "departments")}
        </p>
      ) : null}

      {peopleError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {describeFirestoreError(peopleError, "users")}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <FullScreenStatus message="Loading departments" />
        ) : sortedDepartments.length === 0 && !departmentsError ? (
          <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <p className="text-sm font-medium">No departments yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Departments appear here once an admin adds them to the departments
              collection.
            </p>
          </div>
        ) : (
          sortedDepartments.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              lead={people?.get(department.leadId)}
              members={membersByDepartment.get(department.id) ?? []}
            />
          ))
        )}

        {!loading && departments !== null && unassigned.length > 0 ? (
          <UnassignedCard people={unassigned} />
        ) : null}
      </div>
    </main>
  );
}

function DepartmentCard({
  department,
  lead,
  members,
}: {
  department: Department;
  lead: UserProfile | undefined;
  members: UserProfile[];
}) {
  const totalCapacity = members.reduce(
    (sum, member) => sum + member.weeklyCapacity,
    0,
  );

  return (
    <section
      aria-labelledby={`department-${department.id}`}
      className="rounded-lg border border-border bg-surface"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2
            id={`department-${department.id}`}
            className="text-sm font-semibold tracking-tight"
          >
            {department.name || department.id}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Lead:{" "}
            {lead ? (
              <span className="text-foreground">
                {displayNameFor(lead, null, lead.uid)}
                {lead.role ? <span className="text-muted"> · {lead.role}</span> : null}
              </span>
            ) : department.leadId ? (
              <span className="font-mono">
                {department.leadId.slice(0, 6)}… (not in directory)
              </span>
            ) : (
              "not set"
            )}
          </p>
        </div>

        <dl className="flex gap-6 text-right">
          <div>
            <dt className={sectionLabelClass}>Members</dt>
            <dd className="mt-1 font-mono text-lg leading-none">{members.length}</dd>
          </div>
          <div>
            <dt className={sectionLabelClass}>Weekly cap.</dt>
            <dd className="mt-1 font-mono text-lg leading-none">
              {totalCapacity > 0 ? totalCapacity : "—"}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-px bg-border md:grid-cols-3">
        <ListBlock title="Objectives" items={department.objectives} ordered />
        <ListBlock title="KPIs" items={department.kpis} />

        <div className="bg-surface px-5 py-4">
          <h3 className={sectionLabelClass}>Members</h3>
          {members.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {members.map((member) => (
                <MemberRow
                  key={member.uid}
                  person={member}
                  isLead={member.uid === department.leadId}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted">Nobody is assigned yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ListBlock({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <div className="bg-surface px-5 py-4">
      <h3 className={sectionLabelClass}>{title}</h3>
      {items.length > 0 ? (
        <ListTag
          className={`mt-2 space-y-1.5 pl-4 text-xs leading-relaxed marker:text-muted ${
            ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <p className="mt-2 text-xs text-muted">None recorded.</p>
      )}
    </div>
  );
}

function MemberRow({ person, isLead }: { person: UserProfile; isLead: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-xs">
      <span className="min-w-0 truncate">
        {displayNameFor(person, null, person.uid)}
        {isLead ? (
          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            Lead
          </span>
        ) : null}
        {person.role ? <span className="text-muted"> · {person.role}</span> : null}
      </span>
      <span className="shrink-0 font-mono text-muted">
        {person.weeklyCapacity > 0 ? person.weeklyCapacity : "—"}
      </span>
    </li>
  );
}

/**
 * People with no department, or one whose id matches no department document —
 * typically a profile still holding a department name from before the switch
 * to ids. Shown so the data gap is visible rather than silently dropped.
 */
function UnassignedCard({ people }: { people: UserProfile[] }) {
  return (
    <section
      aria-labelledby="department-unassigned"
      className="rounded-lg border border-dashed border-border-strong bg-surface px-5 py-4"
    >
      <h2 id="department-unassigned" className="text-sm font-semibold tracking-tight">
        Not in a department
      </h2>
      <p className="mt-1 text-xs text-muted">
        These profiles have an empty or unrecognised department. Set{" "}
        <code className="font-mono">users.department</code> to a department&apos;s
        document id.
      </p>
      <ul className="mt-3 space-y-1.5">
        {people.map((person) => (
          <li
            key={person.uid}
            className="flex items-baseline justify-between gap-3 text-xs"
          >
            <span className="min-w-0 truncate">
              {displayNameFor(person, null, person.uid)}
              {person.role ? <span className="text-muted"> · {person.role}</span> : null}
            </span>
            <span className="shrink-0 font-mono text-muted">
              {person.departmentId ? `"${person.departmentId}"` : "empty"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
