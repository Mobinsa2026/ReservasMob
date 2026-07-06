import type { BookingStatus } from "../../lib/types";
import { STATUS_LABELS } from "../../lib/types";

const statusClass: Record<BookingStatus, string> = {
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
