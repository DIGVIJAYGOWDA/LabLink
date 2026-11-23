from datetime import date

from fastapi import APIRouter, Query

from app.api.deps import RepoDep, error_responses
from app.schemas.lab import Resource, ResourceAvailability, ResourceType
from app.services import catalogue

router = APIRouter(prefix="/resources", tags=["catalogue"])


@router.get("", response_model=list[Resource])
def list_resources(
    repos: RepoDep,
    q: str | None = Query(None, max_length=100, description="Search name, description, lab or department"),
    department: str | None = Query(None, max_length=80),
    resource_type: ResourceType | None = Query(None, alias="type"),
    available: bool = Query(False, description="Only resources that are not under maintenance"),
):
    return catalogue.list_resources(repos, query=q, department=department, resource_type=resource_type, available_only=available)


@router.get("/{resource_id}", response_model=Resource, responses=error_responses(404))
def get_resource(resource_id: str, repos: RepoDep):
    return catalogue.get_resource(repos, resource_id)


@router.get("/{resource_id}/availability", response_model=ResourceAvailability, responses=error_responses(404, 422))
def get_availability(resource_id: str, repos: RepoDep, day: date = Query(..., alias="date")):
    return catalogue.get_availability(repos, resource_id, day)
