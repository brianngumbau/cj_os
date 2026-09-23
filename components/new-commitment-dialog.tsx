"use client";

import { addDays, format } from "date-fns";
import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { createCommitment } from "@/lib/commitments";
import {
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./form-styles";
import { Modal } from "./modal";

/** The coming Friday — the default close of a weekly commitment. */
function defaultDeadline(): string {
  const today = new Date();
  const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
  return format(addDays(today, daysUntilFriday), "yyyy-MM-dd");
}

type NewCommitmentDialogProps = {
  ownerId: string;
  onClose: () => void;
};

export function NewCommitmentDialog({
  ownerId,
  onClose,
}: NewCommitmentDialogProps) {
  const [objective, setObjective] = useState("");
  const [deliverableExpected, setDeliverableExpected] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!objective.trim() || !deliverableExpected.trim()) {
      setError("An objective and an expected deliverable are both required.");
      return;
    }

    // `type="date"` gives a local calendar day; commitments are due end of day.
    const deadlineDate = new Date(`${deadline}T23:59:59`);
    if (Number.isNaN(deadlineDate.getTime())) {
      setError("Pick a valid deadline.");
      return;
    }

    setSubmitting(true);
    try {
      await createCommitment({
        ownerId,
        objective,
        deliverableExpected,
        deadline: deadlineDate,
      });
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Could not save: ${caught.message}`
          : "Could not save the commitment.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="New commitment"
      description="One objective, one deliverable, one deadline. It opens as pending."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="objective" className={labelClass}>
            Objective
          </label>
          <textarea
            id="objective"
            required
            rows={2}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Ship the onboarding flow for pilot partners"
          />
        </div>

        <div>
          <label htmlFor="deliverable" className={labelClass}>
            Deliverable expected
          </label>
          <input
            id="deliverable"
            required
            value={deliverableExpected}
            onChange={(event) => setDeliverableExpected(event.target.value)}
            className={inputClass}
            placeholder="Merged PR + staging walkthrough recording"
          />
          <p className={hintClass}>
            State the artifact you will produce. It is what you will link as
            evidence when you close this out.
          </p>
        </div>

        <div>
          <label htmlFor="deadline" className={labelClass}>
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            required
            value={deadline}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(event) => setDeadline(event.target.value)}
            className={inputClass}
          />
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
            Commit
          </button>
        </div>
      </form>
    </Modal>
  );
}
