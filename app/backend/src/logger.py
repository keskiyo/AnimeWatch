"""
Centralised logging for AnimeWatch backend — errors and warnings only.

Usage:
    from src.logger import get_logger
    log = get_logger(__name__)
    log.warning("studio %r not found", name)
    log.error("fetch failed: %s", exc)
"""
import logging
import sys

_configured = False


def configure_logging() -> None:
    global _configured
    if _configured:
        return
    _configured = True

    fmt = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt, datefmt="%H:%M:%S"))
    handler.setLevel(logging.WARNING)

    root = logging.getLogger()
    root.setLevel(logging.WARNING)
    root.handlers.clear()
    root.addHandler(handler)

    # Silence noisy libraries
    for lib in ("httpx", "httpcore", "uvicorn.access", "uvicorn.error"):
        logging.getLogger(lib).setLevel(logging.ERROR)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
