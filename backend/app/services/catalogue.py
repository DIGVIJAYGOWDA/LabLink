from datetime import date

from app.core.errors import BusinessRuleError, NotFoundError
from app.repositories import Repositories
from app.schemas.lab import Resource, ResourceAvailability, ResourceType, SlotAvailability
from app.services import scheduling


def list_resources(
    repos: Repositories,
    *,
    query: str | None = None,
    department: str | None = None,
    resource_type: ResourceType | None = None,
    available_only: bool = False,
) -> list[Resource]:
    q = (query or "").strip().lower()
    items = [
        r
        for r in repos.resources.list()
        if (not q or q in f"{r.name} {r.description} {r.lab} {r.department}".lower())
        and (not department or r.department.lower() == department.lower())
        and (not resource_type or r.type == resource_type)
        and (not available_only or r.status == "available")
    ]
    return sorted(items, key=lambda r: (r.department, r.name))


def get_resource(repos: Repositories, resource_id: str) -> Resource:
    resource = repos.resources.get(resource_id)
    if not resource:
        raise NotFoundError(f"Resource '{resource_id}' was not found.")
    return resource


def get_availability(repos: Repositories, resource_id: str, day: date) -> ResourceAvailability:
    resource = get_resource(repos, resource_id)
    if day < scheduling.today() or day > scheduling.window_end():
        raise BusinessRuleError(
            f"Availability is only shown for the next {scheduling.get_settings().booking_window_days} days.",
            field="date",
        )
    bookings = repos.bookings.list()
    slots = [
        SlotAvailability(
            id=s.id,
            label=s.label,
            state=scheduling.slot_state(bookings, resource_id, day, s.id),
            started=scheduling.slot_started(day, s.id),
        )
        for s in scheduling.TIME_SLOTS
    ]
    return ResourceAvailability(resource_id=resource_id, date=day, bookable=resource.status == "available", slots=slots)
