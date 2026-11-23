"""Supabase (PostgreSQL) client. The backend uses the service-role key, so this must only run server-side."""

from functools import lru_cache

from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings
from app.core.errors import DatabaseError


def supabase_configured() -> bool:
    s = get_settings()
    return bool(s.supabase_url and s.supabase_service_role_key)


@lru_cache
def get_supabase() -> Client:
    if not supabase_configured():
        raise DatabaseError("The database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    s = get_settings()
    try:
        return create_client(
            s.supabase_url,
            s.supabase_service_role_key,
            options=ClientOptions(postgrest_client_timeout=s.database_timeout_seconds),
        )
    except Exception as exc:  # invalid URL or key format
        raise DatabaseError("The database client could not be created. Check SUPABASE_URL and the key.") from exc
