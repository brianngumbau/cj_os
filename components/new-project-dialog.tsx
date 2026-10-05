"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { displayNameFor } from "@/lib/auth-context";
import { createProject } from "@/lib/projects";
import { PROJECT_STAGES, PROJECT_STATUSES } from "@/lib/types";
import type {
  Department,
  ProjectStage,
  ProjectStatus,
  UserProfile,
} from "@/lib/types";
import {
  errorClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./form-styles";
import { Modal } from "./modal";

type NewProjectDialogProps = {
  currentUserId: string;
  people: UserProfile[];
  departments: Department[];
  onClose: () => void;
};

export function NewProjectDialog({
  currentUserId,
  people,
  departments,
  onClose,
}: NewProjectDialogProps) {
  const departmentOf = (uid: string) => {
    const id = people.find((person) => person.uid === uid)?.departmentId ?? "";
    return departments.some((department) => department.id === id) ? id : "";
  };

  const [name, setName] = useState("");
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [departmentId, setDepartmentId] = useState(() =>
    departmentOf(currentUserId),
  );
  const [objective, setObjective] = useState("");
  const [stage, setStage] = useState<ProjectStage>("Idea");
  const [status, setStatus] = useState<ProjectStatus>("On Track");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The current user may not have a `users` document yet; keep them selectable.
  const ownerOptions = people.map((person) => ({
    uid: person.uid,
    label:
      displayNameFor(person, null, person.uid) +
      (person.uid === currentUserId ? " (you)" : ""),
  }));
  if (!people.some((person) => person.uid === currentUserId)) {
    ownerOptions.unshift({ uid: currentUserId, label: "You" });
  }

  function handleOwnerChange(nextOwnerId: string) {
    setOwnerId(nextOwnerId);
    // Follow the owner's department, unless they have none on file.
    const ownerDepartment = departmentOf(nextOwnerId);
    if (ownerDepartment) setDepartmentId(ownerDepartment);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !objective.trim()) {
      setError("A project name and an objective are both required.");
      return;
    }
    if (!ownerId) {
      setError("Pick an owner.");
      return;
    }
    if (!departmentId) {
      setError("Pick a department.");
      return;
    }

    setSubmitting(true);
    try {
      await createProject({ name, ownerId, departmentId, objective, stage, status });
      onClose();
    } catch (caught) {
      console.error("Firestore write error (create project):", caught);
      setError(
        caught instanceof Error
          ? `Could not save: ${caught.message}`
          : "Could not save the project.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="New project"
      description="Projects start with no tasks — progress fills in as linked commitments are completed."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className={labelClass}>
            Name
          </label>
          <input
            id="project-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder="Partner onboarding portal"
          />
        </div>

        <div>
          <label htmlFor="project-objective" className={labelClass}>
            Objective
          </label>
          <textarea
            id="project-objective"
            required
            rows={2}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Cut pilot partner onboarding from two weeks to two days"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="project-owner" className={labelClass}>
              Owner
            </label>
            <select
              id="project-owner"
              required
              value={ownerId}
              onChange={(event) => handleOwnerChange(event.target.value)}
              className={inputClass}
            >
              {ownerOptions.map((option) => (
                <option key={option.uid} value={option.uid}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-department" className={labelClass}>
              Department
            </label>
            <select
              id="project-department"
              required
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                {departments.length === 0 ? "No departments yet" : "Select…"}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name || department.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-stage" className={labelClass}>
              Stage
            </label>
            <select
              id="project-stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as ProjectStage)}
              className={inputClass}
            >
              {PROJECT_STAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-status" className={labelClass}>
              Status
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className={inputClass}
            >
              {PROJECT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {departments.length === 0 ? (
          <p className={hintClass}>
            Add a document to the departments collection before creating projects.
          </p>
        ) : null}

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
            disabled={submitting || departments.length === 0}
            className={primaryButtonClass}
          >
            {submitting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}
