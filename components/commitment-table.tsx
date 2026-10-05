"use client";

import { format } from "date-fns";
import {
  ExternalLink,
  FolderKanban,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import { displayNameFor } from "@/lib/auth-context";
import { departmentLabel, useDepartments } from "@/lib/departments";
import type { Commitment, Project, UserProfile } from "@/lib/types";
import { StatusBadge } from "./status-badge";

/** Short, human label for an evidence URL. Falls back to the raw string. */
function linkLabel(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

const headerCellClass =
  "px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted";

const actionButtonClass =
  "rounded border border-border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50";

type CommitmentTableProps = {
  commitments: Commitment[];
  directory: Map<string, UserProfile>;
  projects: Map<string, Project>;
  currentUserId: string;
  currentUserEmail: string | null;
  busyId: string | null;
  onRequestEvidence: (commitment: Commitment) => void;
  onRequestBlocker: (commitment: Commitment) => void;
  onReopen: (commitment: Commitment) => void;
};

export function CommitmentTable({
  commitments,
  directory,
  projects,
  currentUserId,
  currentUserEmail,
  busyId,
  onRequestEvidence,
  onRequestBlocker,
  onReopen,
}: CommitmentTableProps) {
  const { departments } = useDepartments();
  const now = Date.now();

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th scope="col" className={headerCellClass}>
              Objective
            </th>
            <th scope="col" className={headerCellClass}>
              Owner
            </th>
            <th scope="col" className={headerCellClass}>
              Deadline
            </th>
            <th scope="col" className={headerCellClass}>
              Status
            </th>
            <th scope="col" className={headerCellClass}>
              Evidence
            </th>
            <th scope="col" className={`${headerCellClass} text-right`}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {commitments.map((commitment) => {
            const owner = directory.get(commitment.ownerId);
            const isOwn = commitment.ownerId === currentUserId;
            const deadlineDate = commitment.deadline?.toDate() ?? null;
            const isOverdue =
              deadlineDate !== null &&
              deadlineDate.getTime() < now &&
              commitment.status !== "completed";
            const isBusy = busyId === commitment.id;
            const project = commitment.projectId
              ? projects.get(commitment.projectId)
              : undefined;

            return (
              <tr
                key={commitment.id}
                className="border-b border-border last:border-b-0 align-top"
              >
                <td className="px-4 py-3">
                  {commitment.projectId ? (
                    <p className="mb-1">
                      <span className="inline-flex max-w-full items-center gap-1 truncate rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                        <FolderKanban className="size-3 shrink-0" aria-hidden />
                        {project?.name || "Unknown project"}
                      </span>
                    </p>
                  ) : null}
                  <p className="font-medium leading-snug">
                    {commitment.objective}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted">
                    {commitment.deliverableExpected}
                  </p>
                  {commitment.status === "blocked" && commitment.blockerReason ? (
                    <p className="mt-2 flex items-start gap-1.5 rounded border border-blocked/30 bg-blocked-surface px-2 py-1 text-xs leading-snug text-blocked">
                      <TriangleAlert
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      {commitment.blockerReason}
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="leading-snug">
                    {displayNameFor(
                      owner,
                      isOwn ? currentUserEmail : null,
                      commitment.ownerId,
                    )}
                    {isOwn ? (
                      <span className="ml-1.5 text-[11px] text-muted">(you)</span>
                    ) : null}
                  </p>
                  {owner?.departmentId ? (
                    <p className="mt-0.5 text-xs text-muted">
                      {departmentLabel(departments, owner.departmentId)}
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-mono text-xs">
                    {deadlineDate ? format(deadlineDate, "EEE d MMM") : "—"}
                  </p>
                  {isOverdue ? (
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-blocked">
                      Overdue
                    </p>
                  ) : null}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={commitment.status} />
                </td>

                <td className="px-4 py-3">
                  {commitment.evidenceLink ? (
                    <a
                      href={commitment.evidenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-[12rem] items-center gap-1.5 truncate font-mono text-xs text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                    >
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                      {linkLabel(commitment.evidenceLink)}
                    </a>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {isOwn ? (
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {isBusy ? (
                        <LoaderCircle
                          className="size-4 animate-spin text-muted"
                          aria-label="Saving"
                        />
                      ) : null}

                      {commitment.status !== "completed" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRequestEvidence(commitment)}
                          className={`${actionButtonClass} border-completed/40 text-completed`}
                        >
                          Complete
                        </button>
                      ) : null}

                      {commitment.status === "pending" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onRequestBlocker(commitment)}
                          className={`${actionButtonClass} border-blocked/40 text-blocked`}
                        >
                          Blocked
                        </button>
                      ) : null}

                      {commitment.status !== "pending" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onReopen(commitment)}
                          className={`${actionButtonClass} inline-flex items-center gap-1 text-muted`}
                        >
                          <RotateCcw className="size-3" aria-hidden />
                          Reopen
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-right text-xs text-muted">Read only</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
