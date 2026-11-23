import json
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "LabLink API"
    app_version: str = "0.1.0"

    environment: Literal["development", "production", "test"] = "development"
    port: int = 8000
    log_level: str = "INFO"

    # Booking rules (shared with the frontend's 14-day booking window)
    booking_window_days: int = 14

    # Data store: "supabase" (PostgreSQL), "memory" (non-persistent mock data) or "auto"
    # (Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, otherwise memory).
    data_backend: Literal["auto", "supabase", "memory"] = "auto"
    database_timeout_seconds: int = 10
    # Google Gemini (AI assistant + conflict explanations). Get a key at https://aistudio.google.com/apikey
    gemini_api_key: str = ""
    # Primary model and a fallback used when the primary is busy, rate-limited or unavailable
    gemini_model: str = "gemini-flash-lite-latest"
    gemini_fallback_model: str = "gemini-flash-latest"
    gemini_timeout_seconds: int = 25
    # Max assistant questions per client per minute (0 disables the limit)
    assistant_rate_limit_per_minute: int = 20
    # Largest JSON body the API accepts; bigger requests get 413 before any parsing.
    max_request_body_bytes: int = 64 * 1024
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    cors_origins: str = "http://localhost:5173"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        """Accepts a comma-separated list or a JSON list: ["http://a", "http://b"]."""
        raw = self.cors_origins.strip()
        if raw.startswith("["):
            try:
                return [str(o).strip().rstrip("/") for o in json.loads(raw) if str(o).strip()]
            except ValueError:
                raw = raw.strip("[]")
        items = (o.strip().strip("'\"").rstrip("/") for o in raw.split(","))
        return [o for o in items if o]


@lru_cache
def get_settings() -> Settings:
    return Settings()
