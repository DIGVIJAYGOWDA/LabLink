"""Repository wiring: picks the data store from DATA_BACKEND (see core/config.py).

- supabase: Supabase PostgreSQL (persistent, schema in database/schema.sql)
- memory:   in-memory mock data (resets on restart; for local development without a database)
- auto:     supabase when its credentials are set, otherwise memory
"""

import logging
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import get_settings
from app.repositories.base import ActivityRepository, BookingRepository, ResourceRepository

logger = logging.getLogger("lablink.db")


@dataclass(frozen=True)
class Repositories:
    resources: ResourceRepository
    bookings: BookingRepository
    activities: ActivityRepository
    backend: str


def _memory() -> Repositories:
    from app.repositories.memory import (
        InMemoryActivityRepository,
        InMemoryBookingRepository,
        InMemoryResourceRepository,
    )
    from app.repositories.mock_data import build_seed

    resources, bookings, activities = build_seed()
    return Repositories(
        resources=InMemoryResourceRepository(resources),
        bookings=InMemoryBookingRepository(bookings),
        activities=InMemoryActivityRepository(activities),
        backend="memory",
    )


def _supabase() -> Repositories:
    try:
        from app.db.client import get_supabase
        from app.repositories.supabase_repo import (
            SupabaseActivityRepository,
            SupabaseBookingRepository,
            SupabaseResourceRepository,
        )
    except ImportError as exc:
        from app.core.errors import DatabaseError

        raise DatabaseError("The 'supabase' package is missing. Run: pip install -r requirements.txt") from exc

    client = get_supabase()
    return Repositories(
        resources=SupabaseResourceRepository(client),
        bookings=SupabaseBookingRepository(client),
        activities=SupabaseActivityRepository(client),
        backend="supabase",
    )


@lru_cache
def get_repositories() -> Repositories:
    settings = get_settings()
    backend = settings.data_backend
    if backend == "auto":
        backend = "supabase" if settings.supabase_url and settings.supabase_service_role_key else "memory"
    if backend == "supabase":
        logger.info("Data store: Supabase PostgreSQL")
        return _supabase()
    logger.warning("Data store: in-memory mock data (NOT persistent). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist.")
    return _memory()
