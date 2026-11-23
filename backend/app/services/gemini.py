"""Minimal Google Gemini client (REST generateContent) using httpx. The API key is sent in a
header, never in the URL, and is never logged."""

import logging

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


def generate(system: str, messages: list[tuple[str, str]]) -> str:
    """messages: (role, text) pairs with role "user" or "assistant", oldest first."""
    settings = get_settings()
    if not gemini_configured():
        raise AIUnavailableError("The AI assistant is not configured. Set GEMINI_API_KEY on the server.")

    body = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [
            {"role": "model" if role == "assistant" else "user", "parts": [{"text": text}]} for role, text in messages
        ],
    }
    try:
        resp = httpx.post(
            f"{API_BASE}/{settings.gemini_model}:generateContent",
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
            raise AIUnavailableError("The AI service is busy right now. Please try again in a minute.", code="ai_rate_limited")
        if resp.status_code == 404:
            raise AIUnavailableError("The configured AI model was not found. Check GEMINI_MODEL on the server.")
        if resp.status_code in (400, 401, 403):
            raise AIUnavailableError("The AI service rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL.")
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
