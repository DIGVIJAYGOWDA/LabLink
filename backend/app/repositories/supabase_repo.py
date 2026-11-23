"""Supabase (PostgreSQL) implementations of the repository interfaces in base.py.

Tables and constraints are defined in database/schema.sql. Database errors are mapped to the
API's error types so services and routes stay unchanged.
"""

import logging

import httpx
from postgrest.exceptions import APIError
from supabase import Client

from app.core.errors import AppError, BusinessRuleError, ConflictError, DatabaseError, NotFoundError
from app.schemas.lab import Activity, Booking, Resource

logger = logging.getLogger("lablink.db")

_UNIQUE_INDEXES = {
    "uq_bookings_confirmed_slot": ("slot_unavailable", "This slot is already booked."),
    "uq_bookings_student_slot": ("duplicate_booking", "You already have a booking or request for this slot."),
}


def _map_api_error(exc: APIError) -> AppError:
    code = getattr(exc, "code", None)
    text = f"{getattr(exc, 'message', '')} {getattr(exc, 'details', '')}"
    if code == "23505":  # unique_violation
        for index, (err_code, message) in _UNIQUE_INDEXES.items():
            if index in text:
                return ConflictError(message, code=err_code, field="slotId")
        return ConflictError("This record already exists.", code="duplicate")
    if code == "23503":  # foreign_key_violation
        return NotFoundError("A referenced record does not exist.")
    if code in ("23514", "23502", "22P02", "22007", "22008"):  # check / not-null / invalid input
        return BusinessRuleError("The data was rejected by the database.")
    logger.error("Database error %s: %s", code, text.strip())
    if code in ("42P01", "PGRST205"):  # table not found
        return DatabaseError("Database tables are missing. Run database/schema.sql in Supabase.")
    return DatabaseError("A database error occurred. Please try again.")


def _execute(query) -> list[dict]:
    try:
        return query.execute().data or []
    except APIError as exc:
        raise _map_api_error(exc) from exc
    except httpx.HTTPError as exc:
        logger.error("Database request failed: %s", exc)
        raise DatabaseError("The database is unreachable. Please try again shortly.") from exc


class SupabaseResourceRepository:
    def __init__(self, client: Client):
        self._table = lambda: client.table("resources")

    def list(self) -> list[Resource]:
        rows = _execute(self._table().select("*").order("department").order("name"))
        return [Resource.model_validate(r) for r in rows]

    def get(self, resource_id: str) -> Resource | None:
        rows = _execute(self._table().select("*").eq("id", resource_id).limit(1))
        return Resource.model_validate(rows[0]) if rows else None


class SupabaseBookingRepository:
    def __init__(self, client: Client):
        self._table = lambda: client.table("bookings")

    def list(self) -> list[Booking]:
        rows = _execute(self._table().select("*").order("date").order("slot_id"))
        return [Booking.model_validate(r) for r in rows]

    def get(self, booking_id: str) -> Booking | None:
        rows = _execute(self._table().select("*").eq("id", booking_id).limit(1))
        return Booking.model_validate(rows[0]) if rows else None

    def add(self, booking: Booking) -> Booking:
        rows = _execute(self._table().insert(booking.model_dump(mode="json")))
        return Booking.model_validate(rows[0]) if rows else booking

    def update(self, booking: Booking) -> Booking:
        changes = booking.model_dump(mode="json", exclude={"id", "created_at"})
        rows = _execute(self._table().update(changes).eq("id", booking.id))
        if not rows:
            raise NotFoundError(f"Booking '{booking.id}' was not found.")
        return Booking.model_validate(rows[0])


class SupabaseActivityRepository:
    def __init__(self, client: Client):
        self._table = lambda: client.table("activities")

    def list(self, limit: int | None = None) -> list[Activity]:
        query = self._table().select("*").order("at", desc=True)
        if limit:
            query = query.limit(limit)
        return [Activity.model_validate(r) for r in _execute(query)]

    def add(self, activity: Activity) -> Activity:
        rows = _execute(self._table().insert(activity.model_dump(mode="json")))
        return Activity.model_validate(rows[0]) if rows else activity
