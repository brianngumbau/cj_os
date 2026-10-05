"use client";

import { SquareKanban, List, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FirestoreError } from "firebase/firestore";

import { displayNameFor, useAuth } from "@/lib/auth-context";
import { useDepartments } from "@/lib/departments";
import { subscribeToProjects } from "@/lib/projects";
import type { Project, UserProfile } from "@/lib/types";
import { subscribeToDirectory } from "@/lib/users";
import { errorClass, primaryButtonClass } from "./form-styles";
import { FullScreenStatus } from "./full-screen-status";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectList, ProjectPipeline } from "./project-views";

type View = "list" | "pipeline";

function describeFirestoreError(error: FirestoreError): string {
  if (error.code === "permission-denied") {
    return "Firestore refused this read. Check the security rules on the projects collection.";
  }
  if (error.code === "unavailable") {
    return "Cannot reach Firestore. Check your connection.";
  }
  return `Could not load projects (${error.code}).`;
}

export function ProjectsHub() {
  const { user } = useAuth();
  const { departments } = useDepartments();

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [people, setPeople] = useState<Map<string, UserProfile>>(() => new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return subscribeToProjects(
      (next) => {
        setProjects(next);
        setLoadError(null);
      },
      (error) => setLoadError(describeFirestoreError(error)),
    );
  }, []);

  useEffect(() => {
    // Owner names are a nicety; fall back to short ids if users is unreadable.
    return subscribeToDirectory(setPeople, () => setPeople(new Map()));
  }, []);

  const sortedPeople = useMemo(
    () =>
      [...people.values()].sort((a, b) =>
        displayNameFor(a, null, a.uid).localeCompare(displayNameFor(b, null, b.uid)),
      ),
    [people],
  );

  const sortedDepartments = useMemo(
    () =>
      [...(departments?.values() ?? [])].sort((a, b) =>
        (a.name || a.id).localeCompare(b.name || b.id),
      ),
    [departments],
  );

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            {projects
              ? `${projects.length} ${projects.length === 1 ? "project" : "projects"} across the pipeline.`
              : "Every project, from idea to pilot."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={primaryButtonClass}
          >
            <Plus className="size-4" aria-hidden />
            New project
          </button>
        </div>
      </div>

      {loadError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {loadError}
        </p>
      ) : null}

      <div className="mt-6">
        {projects === null && !loadError ? (
          <FullScreenStatus message="Loading projects" />
        ) : projects === null ? null : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <p className="text-sm font-medium">No projects yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Create one with a name, an owner, a department and the objective it
              exists to hit.
            </p>
          </div>
        ) : view === "list" ? (
          <ProjectList projects={projects} people={people} departments={departments} />
        ) : (
          <ProjectPipeline
            projects={projects}
            people={people}
            departments={departments}
          />
        )}
      </div>

      {creating ? (
        <NewProjectDialog
          currentUserId={user.uid}
          people={sortedPeople}
          departments={sortedDepartments}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </main>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (view: View) => void;
}) {
  const options = [
    { value: "list", label: "List", Icon: List },
    { value: "pipeline", label: "Pipeline", Icon: SquareKanban },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Project view"
      className="flex rounded-md border border-border p-0.5"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            view === value
              ? "bg-surface-muted text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
