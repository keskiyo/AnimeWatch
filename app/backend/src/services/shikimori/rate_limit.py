"""Global request throttling for Shikimori.

Shikimori limits clients to ~5 rps / 90 rpm. Parallel page fetches
(asyncio.gather) would otherwise burst all at once and get 429s —
every outgoing request first waits on a shared throttle that enforces
a minimum interval between requests process-wide.
"""

import asyncio
import time


class Throttle:
    """Enforce a minimum interval between requests across all tasks."""

    def __init__(self, min_interval_seconds: float) -> None:
        self.min_interval = min_interval_seconds
        self._lock = asyncio.Lock()
        self._last_request_at = 0.0

    async def wait(self) -> None:
        async with self._lock:
            now = time.monotonic()
            delay = self._last_request_at + self.min_interval - now
            if delay > 0:
                await asyncio.sleep(delay)
            self._last_request_at = time.monotonic()


# Alias matching the name used in sync specs/docs
AsyncRateLimiter = Throttle

# ~3 rps for GraphQL keeps us safely under Shikimori's limit
gql_throttle = Throttle(0.35)
# REST endpoints are hit less often, a small gap is enough
rest_throttle = Throttle(0.25)
# Full/recent catalog sync: very conservative ~70 rpm (limit is 90 rpm).
# Combined with gql/rest throttles this keeps long imports stable.
sync_rate_limiter = Throttle(0.85)
