import { CircleCheckBig, CircleDashed, TriangleAlert } from "lucide-react";

import type { CommitmentStatus } from "@/lib/types";

const STATUS_META = {
  pending: {
    label: "Pending",
    Icon: CircleDashed,
    className: "border-pending/30 bg-pending-surface text-pending",
  },
  completed: {
    label: "Completed",
    Icon: CircleCheckBig,
    className: "border-completed/30 bg-completed-surface text-completed",
  },
  blocked: {
    label: "Blocked",
    Icon: TriangleAlert,
    className: "border-blocked/30 bg-blocked-surface text-blocked",
  },
} as const satisfies Record<
  CommitmentStatus,
  { label: string; Icon: typeof CircleDashed; className: string }
>;

export function StatusBadge({ status }: { status: CommitmentStatus }) {
  const { label, Icon, className } = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${className}`}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
