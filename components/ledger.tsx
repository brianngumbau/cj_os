"use client";

import { Plus, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FirestoreError } from "firebase/firestore";

import { useAuth } from "@/lib/auth-context";
import { reopenCommitment, subscribeToCommitments } from "@/lib/commitments";
import type { Commitment, UserProfile } from "@/lib/types";
import { subscribeToDirectory } from "@/lib/users";
import { BlockerDialog } from "./blocker-dialog";
import { CommitmentTable } from "./commitment-table";
import { EvidenceDialog } from "./evidence-dialog";
import { errorClass, primaryButtonClass } from "./form-styles";
import { FullScreenStatus } from "./full-screen-status";
import { NewCommitmentDialog } from "./new-commitment-dialog";

type DialogState =
  | { kind: "new" }
  | { kind: "blocker"; commitment: Commitment }
  | { kind: "evidence"; commitment: Commitment }
  | null;

type Scope = "all" | "mine";

function describeFirestoreError(error: FirestoreError): string {
  if (error.code === "permission-denied") {
    return "Firestore refused this read. Check the security rules on the commitments collection.";
  }
  if (error.code === "failed-precondition") {
    return `Firestore needs an index for this query: ${error.message}`;
  }
  if (error.code === "unavailable") {
    return "Cannot reach Firestore. Check your connection.";
  }
  return `Could not load the ledger (${error.code}).`;
}

export function Ledger() {
  const { user, profile } = useAuth();

  const [commitments, setCommitments] = useState<Commitment[] | null>(null);
  const [directory, setDirectory] = useState<Map<string, UserProfile>>(
    () => new Map(),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToCommitments(
      (next) => {
        setCommitments(next);
        setLoadError(null);
      },
      (error) => setLoadError(describeFirestoreError(error)),
    );
  }, []);

  useEffect(() => {
    // Owner names are a nicety: if the directory is unreadable, the ledger
    // still renders and just falls back to account emails and short ids.
    return subscribeToDirectory(setDirectory, () => setDirectory(new Map()));
  }, []);

  const visible = useMemo(() => {
    if (!commitments) return [];
    return scope === "mine"
      ? commitments.filter((commitment) => commitment.ownerId === user?.uid)
      : commitments;
  }, [commitments, scope, user?.uid]);

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      pending: visible.filter((item) => item.status === "pending").length,
      blocked: visible.filter((item) => item.status === "blocked").length,
      completed: visible.filter((item) => item.status === "completed").length,
      overdue: visible.filter(
        (item) =>
          item.status !== "completed" &&
          item.deadline !== null &&
          item.deadline.toDate().getTime() < now,
      ).length,
    };
  }, [visible]);

  async function handleReopen(commitment: Commitment) {
    setActionError(null);
    setBusyId(commitment.id);
    try {
      await reopenCommitment(commitment.id);
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? `Could not reopen: ${caught.message}`
          : "Could not reopen the commitment.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Commitment ledger
          </h1>
          <p className="mt-1 text-sm text-muted">
            {profile?.weeklyCapacity
              ? `Your weekly capacity is ${profile.weeklyCapacity}.`
              : "Everything the team has committed to, in one place."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ScopeToggle scope={scope} onChange={setScope} />
          <button
            type="button"
            onClick={() => setDialog({ kind: "new" })}
            className={primaryButtonClass}
          >
            <Plus className="size-4" aria-hidden />
            New commitment
          </button>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Blocked" value={counts.blocked} tone="blocked" />
        <Stat label="Completed" value={counts.completed} tone="completed" />
        <Stat label="Overdue" value={counts.overdue} tone="blocked" />
      </dl>

      {loadError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {loadError}
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className={`${errorClass} mt-6`}>
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {actionError}
        </p>
      ) : null}

      <div className="mt-6">
        {commitments === null && !loadError ? (
          <FullScreenStatus message="Loading ledger" />
        ) : visible.length === 0 ? (
          <EmptyState scope={scope} />
        ) : (
          <CommitmentTable
            commitments={visible}
            directory={directory}
            currentUserId={user.uid}
            currentUserEmail={user.email}
            busyId={busyId}
            onRequestEvidence={(commitment) =>
              setDialog({ kind: "evidence", commitment })
            }
            onRequestBlocker={(commitment) =>
              setDialog({ kind: "blocker", commitment })
            }
            onReopen={handleReopen}
          />
        )}
      </div>

      {dialog?.kind === "new" ? (
        <NewCommitmentDialog
          ownerId={user.uid}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "blocker" ? (
        <BlockerDialog
          commitment={dialog.commitment}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.kind === "evidence" ? (
        <EvidenceDialog
          commitment={dialog.commitment}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </main>
  );
}

function ScopeToggle({
  scope,
  onChange,
}: {
  scope: Scope;
  onChange: (scope: Scope) => void;
}) {
  const options: Array<{ value: Scope; label: string }> = [
    { value: "all", label: "Everyone" },
    { value: "mine", label: "Mine" },
  ];

  return (
    <div
      role="group"
      aria-label="Ledger scope"
      className="flex rounded-md border border-border p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={scope === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            scope === option.value
              ? "bg-surface-muted text-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "blocked" | "completed";
}) {
  const toneClass =
    tone === "blocked" && value > 0
      ? "text-blocked"
      : tone === "completed" && value > 0
        ? "text-completed"
        : "text-foreground";

  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className={`mt-1 font-mono text-2xl leading-none ${toneClass}`}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ scope }: { scope: Scope }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
      <p className="text-sm font-medium">
        {scope === "mine"
          ? "You have nothing on the ledger."
          : "The ledger is empty."}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
        Add a commitment with an objective, the deliverable it produces, and the
        date it is due.
      </p>
    </div>
  );
}
