"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { completeCommitment } from "@/lib/commitments";
import type { Commitment } from "@/lib/types";
import {
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./form-styles";
import { Modal } from "./modal";

function isUsableLink(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

type EvidenceDialogProps = {
  commitment: Commitment;
  onClose: () => void;
};

export function EvidenceDialog({ commitment, onClose }: EvidenceDialogProps) {
  const [link, setLink] = useState(commitment.evidenceLink ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isUsableLink(link)) {
      setError("Paste a full link, starting with https://");
      return;
    }

    setSubmitting(true);
    try {
      await completeCommitment(commitment.id, link);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Could not save: ${caught.message}`
          : "Could not close out the commitment.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Close out with evidence"
      description={commitment.objective}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Deliverable expected
          </p>
          <p className="mt-1 text-sm">{commitment.deliverableExpected}</p>
        </div>

        <div>
          <label htmlFor="evidence-link" className={labelClass}>
            Evidence link
          </label>
          <input
            id="evidence-link"
            type="url"
            required
            inputMode="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            className={`${inputClass} font-mono text-xs`}
            placeholder="https://github.com/cjlabs/…/pull/42"
          />
          <p className={hintClass}>
            Link the artifact itself — PR, doc, recording, dashboard. Nothing is
            marked completed without it.
          </p>
        </div>

        {error ? (
          <p role="alert" className={errorClass}>
            <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            Mark completed
          </button>
        </div>
      </form>
    </Modal>
  );
}
