/** Shared form styling, so every input and button in CJ OS matches. */

export const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted";

export const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:ring-2 focus:ring-accent/20";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60";

export const errorClass =
  "flex items-start gap-2 rounded-md border border-blocked/30 bg-blocked-surface px-3 py-2 text-xs text-blocked";

export const hintClass = "mt-1.5 text-[11px] leading-relaxed text-muted";
