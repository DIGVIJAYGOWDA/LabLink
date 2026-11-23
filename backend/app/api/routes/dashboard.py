from fastapi import APIRouter, Query

from app.api.deps import RepoDep, error_responses
from app.schemas.lab import Activity, DashboardSummary, Role
from app.services import activity, dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardSummary, responses=error_responses(422))
def get_dashboard(
    repos: RepoDep,
    role: Role = Query("faculty"),
    student: str | None = Query(None, max_length=80, description="Required when role=student"),
):
    return dashboard.get_summary(repos, role, student)


@router.get("/activity", response_model=list[Activity])
def list_activity(repos: RepoDep, limit: int = Query(20, ge=1, le=100)):
    return activity.list_activity(repos, limit)
