const ALLOWED_PLAYER_HOSTS = new Set([
  "kodik.info",
  "kodik.cc",
  "kodik.biz",
  "kodik.online",
  "kodikplayer.com",
  "aniboom.one"
]);

export function isAllowedPlayerUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_PLAYER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
