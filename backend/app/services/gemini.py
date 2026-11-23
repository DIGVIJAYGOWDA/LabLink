"""Minimal Google Gemini client (REST generateContent) using httpx. The API key is sent in a
header, never in the URL, and is never logged."""

import logging
import time

import httpx

from app.core.config import get_settings
from app.core.errors import AppError

logger = logging.getLogger("lablink.ai")

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class AIUnavailableError(AppError):
    status_code = 503
    code = "ai_unavailable"


def gemini_configured() -> bool:
    return bool(get_settings().gemini_api_key.strip())


# Errors worth retrying on the fallback model (a bad key or bad request would fail there too)
_RETRYABLE = {"ai_busy", "ai_rate_limited", "ai_model_not_found", "ai_unavailable"}


def generate(system: str, messages: list[tuple[str, str]]) -> str:
    """messages: (role, text) pairs with role "user" or "assistant", oldest first.
    Tries GEMINI_MODEL, then GEMINI_FALLBACK_MODEL if the first is busy or unavailable."""
    settings = get_settings()
    if not gemini_configured():
        raise AIUnavailableError("The AI assistant is not configured. Set GEMINI_API_KEY on the server.")
    models = [settings.gemini_model]
    if settings.gemini_fallback_model and settings.gemini_fallback_model != settings.gemini_model:
        models.append(settings.gemini_fallback_model)

    last_error: AIUnavailableError | None = None
    for attempt in range(2):  # demand spikes usually clear within seconds: one short second round
        if attempt:
            if last_error is None or last_error.code not in ("ai_busy", "ai_rate_limited"):
                break
            time.sleep(1.5)
        for model in models:
            try:
                return _generate_with(model, system, messages)
            except AIUnavailableError as exc:
                if exc.code not in _RETRYABLE:
                    raise
                logger.warning("Gemini model %s failed (%s); trying the next option", model, exc.code)
                last_error = exc
    assert last_error is not None
    raise last_error


def _generate_with(model: str, system: str, messages: list[tuple[str, str]]) -> str:
    settings = get_settings()

    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [
            {"role": "model" if role == "assistant" else "user", "parts": [{"text": text}]} for role, text in messages
        ],
    }
    try:
        resp = httpx.post(
            f"{API_BASE}/{model}:generateContent",
            json=body,
            headers={"x-goog-api-key": settings.gemini_api_key.strip()},
            timeout=settings.gemini_timeout_seconds,
        )
    except httpx.HTTPError as exc:
        logger.error("Gemini request failed: %s", type(exc).__name__)
        raise AIUnavailableError("The AI service could not be reached. Please try again.") from exc

    if resp.status_code != 200:
        logger.error("Gemini returned %s: %s", resp.status_code, resp.text[:300])
        if resp.status_code == 429:
            raise AIUnavailableError(
                "The AI service is busy right now. Please try again in a minute.", code="ai_rate_limited"
            )
        if resp.status_code in (500, 503, 504):
            raise AIUnavailableError("The AI model is busy right now. Please try again in a moment.", code="ai_busy")
        if resp.status_code == 404:
            raise AIUnavailableError(
                "The configured AI model was not found. Check GEMINI_MODEL on the server.", code="ai_model_not_found"
            )
        if "API_KEY_INVALID" in resp.text or resp.status_code == 401:
            raise AIUnavailableError(
                "The Gemini API key is not valid. Check GEMINI_API_KEY on the server.", code="ai_key_invalid"
            )
        if resp.status_code == 403:
            raise AIUnavailableError(
                "The Gemini API key is not allowed to call this API. Check the key's restrictions in Google AI Studio.",
                code="ai_key_invalid",
            )
        if resp.status_code == 400:
            raise AIUnavailableError("The AI service rejected the request. Check GEMINI_MODEL on the server.")
        raise AIUnavailableError("The AI service returned an error. Please try again.")

    try:
        candidate = (resp.json().get("candidates") or [{}])[0]
        parts = candidate.get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
    except ValueError as exc:
        raise AIUnavailableError("The AI service returned an unreadable answer.") from exc
    if not text:
        raise AIUnavailableError("The AI service returned an empty answer. Please rephrase your question.")
    return text
