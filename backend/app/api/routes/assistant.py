from fastapi import APIRouter, Request

from app.api.deps import RepoDep, error_responses
from app.core.rate_limit import assistant_limiter, client_key
from app.schemas.lab import ChatRequest, ChatResponse
from app.services import assistant

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse, responses=error_responses(422, 429, 503))
def chat(payload: ChatRequest, repos: RepoDep, request: Request):
    """Ask the LabLink assistant (Gemini) about free labs, equipment, bookings and conflicts."""
    assistant_limiter().check(client_key(request))
    return assistant.chat(repos, payload)
