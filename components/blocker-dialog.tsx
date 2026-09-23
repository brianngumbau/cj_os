"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { blockCommitment } from "@/lib/commitments";
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

/** A blocker without an explanation is just a missed deadline. */
const MINIMUM_REASON_LENGTH = 10;

type BlockerDialogProps = {
  commitment: Commitment;
  onClose: () => void;
};

export function BlockerDialog({ commitment, onClose }: BlockerDialogProps) {
  const [reason, setReason] = useState(commitment.blockerReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (reason.trim().length < MINIMUM_REASON_LENGTH) {
      setError(
        `Explain the blocker in at least ${MINIMUM_REASON_LENGTH} characters.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await blockCommitment(commitment.id, reason);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Could not save: ${caught.message}`
          : "Could not flag the blocker.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Flag a blocker"
      description={commitment.objective}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="blocker-reason" className={labelClass}>
            What is blocking this?
          </label>
          <textarea
            id="blocker-reason"
            required
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Waiting on the partner API keys — requested Monday, no response yet."
          />
          <p className={hintClass}>
            Name the dependency and who owns it. This is what the rest of the
            team reads instead of asking you for a status update.
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
            Mark blocked
          </button>
        </div>
      </form>
    </Modal>
  );
}
