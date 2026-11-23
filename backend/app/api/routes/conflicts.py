from fastapi import APIRouter

from app.api.deps import RepoDep, error_responses
from app.schemas.lab import AllocationRecommendation, Conflict, ConflictResolution
from app.services import allocation

router = APIRouter(prefix="/conflicts", tags=["allocation"])


@router.get("", response_model=list[Conflict])
def list_conflicts(repos: RepoDep):
    """Open conflicts: two or more pending requests for the same resource, date and slot."""
    return allocation.list_conflicts(repos)


@router.get("/{conflict_id}/recommendation", response_model=AllocationRecommendation, responses=error_responses(404))
def get_recommendation(conflict_id: str, repos: RepoDep):
    return allocation.get_recommendation(repos, conflict_id)


@router.post("/{conflict_id}/resolve", response_model=ConflictResolution, responses=error_responses(404))
def resolve_conflict(conflict_id: str, repos: RepoDep):
    """Apply the recommendation: approve the winner and move the other requests to free slots."""
    return allocation.resolve_conflict(repos, conflict_id)
