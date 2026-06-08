import type { AnimeStatus } from "@/types/anime";

export type EmptyStateProps = {
  title: string;
  message: string;
};

export type StatusBadgeProps = {
  status: AnimeStatus;
};
