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
    gemini_model: str = "gemini-flash-latest"
    gemini_timeout_seconds: int = 30
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    cors_origins: str = "http://localhost:5173"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
