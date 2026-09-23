"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Modal shell built on the native `<dialog>` element, so focus trapping, the
 * Escape key and the backdrop come from the platform rather than from us.
 *
 * Mount it to open it, unmount it to close it.
 */
export function Modal({ title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();

    const { documentElement } = document;
    const previousOverflow = documentElement.style.overflow;
    documentElement.style.overflow = "hidden";

    return () => {
      documentElement.style.overflow = previousOverflow;
    };
  }, []);

  /**
   * A click on the backdrop reports the dialog itself as its target. Comparing
   * the pointer against the dialog box as well keeps keyboard-driven clicks
   * (which report coordinates of 0) from being read as a backdrop click.
   */
  function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return;

    const box = dialog.getBoundingClientRect();
    const insideBox =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;

    if (!insideBox) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onClick={handleClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-0 text-foreground shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2
            id="modal-title"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 -mt-1 rounded p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
