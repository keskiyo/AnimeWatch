import { SearchX } from "lucide-react";
import type { EmptyStateProps } from "@/types/ui";

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <section className="grid place-items-center gap-3 rounded-lg border border-dashed border-aw-border bg-aw-surface px-6 py-12 text-center">
      <SearchX aria-hidden="true" size={32} />
      <h2 className="m-0 text-xl font-semibold text-aw-text">{title}</h2>
      <p className="m-0 max-w-lg text-sm leading-6 text-aw-subtle">{message}</p>
    </section>
  );
}
