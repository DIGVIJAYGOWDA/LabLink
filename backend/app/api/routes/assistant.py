from fastapi import APIRouter

from app.api.deps import RepoDep, error_responses
from app.schemas.lab import ChatRequest, ChatResponse
from app.services import assistant

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse, responses=error_responses(422, 503))
def chat(payload: ChatRequest, repos: RepoDep):
    """Ask the LabLink assistant (Gemini) about free labs, equipment, bookings and conflicts."""
    return assistant.chat(repos, payload)
