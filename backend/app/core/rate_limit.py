"""Small in-memory, per-client rate limiter (per server instance). Protects the Gemini quota
behind /api/assistant/chat without adding a dependency."""

import time
from collections import deque
from functools import lru_cache
from threading import Lock

from fastapi import Request

from app.core.config import get_settings
from app.core.errors import AppError


class RateLimitError(AppError):
    status_code = 429
    code = "rate_limited"


class RateLimiter:
    def __init__(self, limit: int, window_seconds: float = 60.0):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()

    def check(self, key: str) -> None:
        if self.limit <= 0:
            return
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > 5000:  # drop idle clients to bound memory
                self._hits = {k: q for k, q in self._hits.items() if q and now - q[-1] < self.window}
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                raise RateLimitError("Too many questions in a short time. Please wait a minute and try again.")
            hits.append(now)


def client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@lru_cache
def assistant_limiter() -> RateLimiter:
    return RateLimiter(get_settings().assistant_rate_limit_per_minute)
