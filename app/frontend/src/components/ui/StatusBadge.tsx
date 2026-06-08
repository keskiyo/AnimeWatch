import type { StatusBadgeProps } from "@/types/ui";
import { STATUS_LABELS } from "@/utils/statusLabels";

const STATUS_CLASSES = {
  ongoing: "bg-[#243326] text-aw-success",
  released: "bg-aw-elevated text-aw-text",
  announced: "bg-[#3b3420] text-aw-warning"
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
