"use client";

import { displayNameFor } from "@/lib/auth-context";
import { departmentLabel } from "@/lib/departments";
import { PROJECT_STAGES } from "@/lib/types";
import type { Department, Project, UserProfile } from "@/lib/types";
import { ProjectProgress, ProjectStatusBadge } from "./project-status-badge";

type ProjectViewProps = {
  projects: Project[];
  people: Map<string, UserProfile>;
  departments: Map<string, Department> | null;
};

const headerCellClass =
  "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted";

function ownerName(people: Map<string, UserProfile>, ownerId: string): string {
  return displayNameFor(people.get(ownerId), null, ownerId);
}

/** View A: every project as a table row with a computed progress bar. */
export function ProjectList({ projects, people, departments }: ProjectViewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th scope="col" className={headerCellClass}>
              Project
            </th>
            <th scope="col" className={headerCellClass}>
              Owner
            </th>
            <th scope="col" className={headerCellClass}>
              Department
            </th>
            <th scope="col" className={headerCellClass}>
              Stage
            </th>
            <th scope="col" className={headerCellClass}>
              Status
            </th>
            <th scope="col" className={`${headerCellClass} w-56`}>
              Progress
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="border-b border-border align-top last:border-b-0"
            >
              <td className="px-4 py-3">
                <p className="font-medium leading-snug">
                  {project.name || "Untitled project"}
                </p>
                {project.objective ? (
                  <p className="mt-0.5 text-xs leading-snug text-muted">
                    {project.objective}
                  </p>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {ownerName(people, project.ownerId)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {departmentLabel(departments, project.departmentId) || "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                {project.stage}
              </td>
              <td className="px-4 py-3">
                <ProjectStatusBadge status={project.status} />
              </td>
              <td className="px-4 py-3">
                <ProjectProgress project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** View B: a board with one column per stage, in pipeline order. */
export function ProjectPipeline({ projects, people, departments }: ProjectViewProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[60rem] grid-cols-5 gap-3">
        {PROJECT_STAGES.map((stage) => {
          const inStage = projects.filter((project) => project.stage === stage);

          return (
            <section
              key={stage}
              aria-labelledby={`stage-${stage}`}
              className="flex flex-col rounded-lg border border-border bg-surface-muted"
            >
              <header className="flex items-baseline justify-between border-b border-border px-3 py-2.5">
                <h2
                  id={`stage-${stage}`}
                  className="text-[11px] font-medium uppercase tracking-wide"
                >
                  {stage}
                </h2>
                <span className="font-mono text-[11px] text-muted">
                  {inStage.length}
                </span>
              </header>

              <ul className="flex flex-1 flex-col gap-2 p-2">
                {inStage.length === 0 ? (
                  <li className="px-1 py-4 text-center text-[11px] text-muted">
                    Nothing here
                  </li>
                ) : (
                  inStage.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-md border border-border bg-surface p-3"
                    >
                      <p className="text-sm font-medium leading-snug">
                        {project.name || "Untitled project"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {ownerName(people, project.ownerId)}
                        {project.departmentId
                          ? ` · ${departmentLabel(departments, project.departmentId)}`
                          : ""}
                      </p>
                      <div className="mt-2.5">
                        <ProjectStatusBadge status={project.status} />
                      </div>
                      <div className="mt-2.5">
                        <ProjectProgress project={project} />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
