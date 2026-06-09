import { format, parseISO } from "date-fns";

export function formatEpisodeLabel(episodeNumber: number): string {
  return `Episode ${episodeNumber}`;
}

export function formatProgressLabel(lastWatchedEpisode: number | undefined, totalEpisodes: number): string {
  const watched = lastWatchedEpisode ?? 0;
  return totalEpisodes > 0 ? `${watched} / ${totalEpisodes} watched` : `${watched} watched`;
}

export function formatDateTime(value: string): string {
  return format(parseISO(value), "MMM d, HH:mm");
}

export function formatDate(value: string): string {
  return format(parseISO(value), "MMM d");
}

export function formatRating(value: number): string {
  return value > 0 ? value.toFixed(1) : "N/A";
}

export function setPageMeta(title: string, description: string) {
  document.title = title
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }
  meta.content = description
}
