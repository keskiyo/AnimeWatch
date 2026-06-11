"""HTTP transport: GraphQL and REST fetchers with retries and throttling."""

import asyncio
from typing import Any
from urllib.parse import urljoin

import httpx
from httpx import HTTPStatusError, TransportError

from src.config import Settings
from src.logger import get_logger
from src.services.shikimori.constants import (
    APP_SORT_TO_GQL_ORDER,
    GQL_ORDER_ENUM,
    GQL_ORDER_FALLBACK,
)
from src.services.shikimori.rate_limit import gql_throttle, rest_throttle

log = get_logger(__name__)


def to_gql_order(value: str | None) -> str:
    """Map an app/REST sort value to a valid GQL OrderEnum value.

    Never lets an invalid order reach Shikimori — unknown values fall back
    to GQL_ORDER_FALLBACK with a warning.
    """
    raw = str(value or "")
    mapped = APP_SORT_TO_GQL_ORDER.get(raw, raw)
    if mapped not in GQL_ORDER_ENUM:
        log.warning(
            "[gql] unknown order %r (mapped %r) — falling back to %r",
            value,
            mapped,
            GQL_ORDER_FALLBACK,
        )
        return GQL_ORDER_FALLBACK
    log.debug("[gql] order in=%r → out=%r", value, mapped)
    return mapped


async def fetch_gql(query: str, settings: Settings) -> Any:
    """Execute a Shikimori GraphQL query. Returns parsed JSON data."""
    max_retries = 3
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        for attempt in range(max_retries):
            await gql_throttle.wait()
            try:
                response = await client.post(
                    settings.shikimori_gql_endpoint,
                    json={"query": query},
                    headers={
                        "User-Agent": settings.shikimori_user_agent,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )
                response.raise_for_status()
                body = response.json()
                if "errors" in body:
                    msgs = [e.get("message", "") for e in body["errors"]]
                    log.warning("[gql] query errors: %s", msgs)
                    # If data is None the whole query failed — raise so result isn't cached
                    if body.get("data") is None:
                        raise RuntimeError("GQL query failed: " + "; ".join(msgs))
                return body.get("data") or {}
            except TransportError as e:
                # Covers ConnectError/timeouts — Shikimori unreachable, retry
                if attempt == max_retries - 1:
                    raise
                log.warning(
                    "[gql] %s (attempt %d/%d) — retrying",
                    type(e).__name__, attempt + 1, max_retries,
                )
                await asyncio.sleep(2 ** (attempt + 1))
            except HTTPStatusError as e:
                if e.response.status_code == 429 or e.response.status_code >= 500:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(_retry_delay(e, attempt))
                else:
                    raise
            except Exception as e:
                log.error("GQL error: %s: %s", type(e).__name__, e)
                raise


async def fetch_gql_single(query: str, settings: Settings) -> dict:
    """Execute query and extract the first anime from data.animes[]."""
    data = await fetch_gql(query, settings)
    animes = (data or {}).get("animes") or []
    return animes[0] if animes else {}


async def fetch_rest_json(
    path: str, settings: Settings, params: dict[str, str] | None = None
) -> Any:
    max_retries = 3
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(max_retries):
            await rest_throttle.wait()
            try:
                response = await client.get(
                    urljoin(settings.shikimori_endpoint + "/", path.lstrip("/")),
                    params=params,
                    headers={
                        "Accept": "application/json",
                        "User-Agent": settings.shikimori_user_agent,
                    },
                )
                response.raise_for_status()
                return response.json()
            except TransportError as e:
                # Covers ConnectError/timeouts — Shikimori unreachable, retry
                if attempt == max_retries - 1:
                    raise
                log.warning(
                    "[rest] %s: %s (attempt %d/%d) — retrying",
                    path, type(e).__name__, attempt + 1, max_retries,
                )
                await asyncio.sleep(2 ** (attempt + 1))
            except HTTPStatusError as e:
                if e.response.status_code == 429 or e.response.status_code >= 500:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(_retry_delay(e, attempt))
                else:
                    raise
            except Exception as e:
                log.error("REST error %s: %s: %s", path, type(e).__name__, e)
                raise


def _retry_delay(error: HTTPStatusError, attempt: int) -> float:
    """Exponential backoff, but respect the server's Retry-After on 429."""
    retry_after = error.response.headers.get("Retry-After")
    if retry_after:
        try:
            return max(float(retry_after), 1.0)
        except ValueError:
            pass
    return float(2**attempt)
