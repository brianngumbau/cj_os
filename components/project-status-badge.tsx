import { projectProgress } from "@/lib/projects";
import type { Project, ProjectStatus } from "@/lib/types";

/** Reuses the three ledger status colours; "On Track" stays neutral. */
const STATUS_CLASS = {
  "On Track": "border-border-strong bg-surface-muted text-foreground",
  "At Risk": "border-pending/30 bg-pending-surface text-pending",
  Blocked: "border-blocked/30 bg-blocked-surface text-blocked",
  Complete: "border-completed/30 bg-completed-surface text-completed",
} as const satisfies Record<ProjectStatus, string>;

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${STATUS_CLASS[status]}`}
    >
      {status}
    </span>
  );
}

/** Bar plus "completed / total" readout, computed from the task counters. */
export function ProjectProgress({ project }: { project: Project }) {
  const percent = projectProgress(project);

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Progress"
        className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={`h-full rounded-full ${percent === 100 ? "bg-completed" : "bg-accent"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted">
        {project.totalTasks === 0
          ? "No tasks"
          : `${percent}% · ${project.completedTasks}/${project.totalTasks}`}
      </span>
    </div>
  );
}
